import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { ServerRegistry } from './ServerRegistry';
import { LoadBalancer, LoadBalancingStrategy } from './LoadBalancer';
import { ApiResponse, RequestContext, MiddlewareFunction } from '@/types';
import { authMiddleware } from '@/middleware/auth';
import { loggerMiddleware } from '@/middleware/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';

/**
 * MCP网关主类
 * 统一管理和路由所有MCP服务请求
 */
export class MCPGateway {
  private app: Express;
  private serverRegistry: ServerRegistry;
  private loadBalancer: LoadBalancer;
  private port: number;
  private host: string;

  constructor() {
    this.app = express();
    this.serverRegistry = new ServerRegistry();
    this.loadBalancer = new LoadBalancer();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.host = process.env.HOST || '0.0.0.0';

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 安全中间件
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 限流中间件
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/mcp', limiter);

    // 日志中间件
    this.app.use(morgan('combined'));
    this.app.use(loggerMiddleware);

    // 自定义中间件
    this.app.use('/api/mcp', authMiddleware);
    this.app.use('/api/mcp', validateRequest);

    // 请求ID中间件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
        },
      });
    });

    // API根路径
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          name: 'MCP Gateway',
          version: '1.0.0',
          description: '专属MCP网关服务器',
          endpoints: {
            health: '/health',
            status: '/api/mcp/status',
            execute: '/api/mcp/:serverName/:toolName',
            listServers: '/api/mcp/servers',
            listTools: '/api/mcp/servers/:serverName/tools',
          },
        },
      });
    });

    // 获取所有服务状态
    this.app.get('/api/mcp/status', (req: Request, res: Response) => {
      try {
        const status = this.serverRegistry.getAllServersStatus();
        const stats = this.serverRegistry.getStats();

        res.json({
          success: true,
          data: {
            services: status,
            statistics: stats,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        this.sendError(res, error, 'GET_STATUS');
      }
    });

    // 获取服务列表
    this.app.get('/api/mcp/servers', (req: Request, res: Response) => {
      try {
        const servers = this.serverRegistry.getServerNames();
        res.json({
          success: true,
          data: { servers },
        });
      } catch (error) {
        this.sendError(res, error, 'LIST_SERVERS');
      }
    });

    // 获取指定服务的工具列表
    this.app.get('/api/mcp/servers/:serverName/tools', (req: Request, res: Response) => {
      try {
        const { serverName } = req.params || {};
        if (!serverName) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: '服务名称不能为空',
            },
          });
        }
        const server = this.serverRegistry.getServer(serverName);

        return res.json({
          success: true,
          data: {
            serverName,
            version: server.version,
            tools: server.tools,
            description: server.description,
          },
        });
      } catch (error) {
        return this.sendError(res, error, 'LIST_TOOLS');
      }
    });

    // 执行MCP工具 - 核心路由
    this.app.post('/api/mcp/:serverName/:toolName', async (req: Request, res: Response) => {
      const startTime = Date.now();
      const { serverName, toolName } = req.params || {};
      const params = req.body;
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';

      if (!serverName || !toolName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: '服务名称和工具名称不能为空',
          },
          meta: {
            requestId,
            timestamp: new Date(),
          },
        });
      }

      try {
        // 验证服务存在
        if (!this.serverRegistry.hasServer(serverName)) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SERVER_NOT_FOUND',
              message: `MCP服务 '${serverName}' 未找到`,
              details: {
                availableServers: this.serverRegistry.getServerNames(),
              },
            },
            meta: {
              requestId,
              timestamp: new Date(),
              serverName,
              toolName,
            },
          });
        }

        // 验证服务在线
        const serverStatus = this.serverRegistry.getServerStatus(serverName);
        if (!serverStatus?.online) {
          return res.status(503).json({
            success: false,
            error: {
              code: 'SERVER_OFFLINE',
              message: `MCP服务 '${serverName}' 当前不可用`,
              details: serverStatus?.error,
            },
            meta: {
              requestId,
              timestamp: new Date(),
              serverName,
              toolName,
            },
          });
        }

        // 执行工具
        const result = await this.serverRegistry.executeTool(serverName, toolName, params);
        const executionTime = Date.now() - startTime;

        return res.json({
          success: true,
          data: result,
          meta: {
            requestId,
            timestamp: new Date(),
            executionTime,
            serverName,
            toolName,
          },
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`[MCPGateway] 执行工具失败 (${serverName}.${toolName}):`, error);

        return res.status(500).json({
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
          meta: {
            requestId,
            timestamp: new Date(),
            executionTime,
            serverName,
            toolName,
          },
        });
      }
    });

    // 404处理
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `端点 ${req.method} ${req.originalUrl} 未找到`,
          details: {
            availableEndpoints: [
              'GET /health',
              'GET /api',
              'GET /api/mcp/status',
              'GET /api/mcp/servers',
              'GET /api/mcp/servers/:serverName/tools',
              'POST /api/mcp/:serverName/:toolName',
            ],
          },
        },
      });
    });
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * 发送错误响应
   */
  private sendError(res: Response, error: any, operation: string): Response {
    const statusCode = error.statusCode || 500;
    const message = error instanceof Error ? error.message : String(error);

    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message,
        operation,
      },
    });
  }

  /**
   * 注册MCP服务
   * @param name 服务名称
   * @param server 服务实例
   */
  registerServer(name: string, server: any): void {
    this.serverRegistry.register(name, server);
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, this.host, () => {
        console.log(`🚀 MCP网关服务器已启动`);
        console.log(`📍 地址: http://${this.host}:${this.port}`);
        console.log(`🏥 健康检查: http://${this.host}:${this.port}/health`);
        console.log(`📊 服务状态: http://${this.host}:${this.port}/api/mcp/status`);
        console.log(`📖 API文档: http://${this.host}:${this.port}/api`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('[MCPGateway] 服务器启动失败:', error);
        reject(error);
      });

      // 优雅关闭
      process.on('SIGTERM', () => this.shutdown(server));
      process.on('SIGINT', () => this.shutdown(server));
    });
  }

  /**
   * 优雅关闭
   */
  private shutdown(server: any): void {
    console.log('[MCPGateway] 正在关闭服务器...');

    this.serverRegistry.stopHealthCheck();

    server.close(() => {
      console.log('[MCPGateway] 服务器已关闭');
      process.exit(0);
    });

    // 强制关闭
    setTimeout(() => {
      console.error('[MCPGateway] 强制关闭服务器');
      process.exit(1);
    }, 10000);
  }

  /**
   * 获取Express应用实例
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * 获取服务注册中心
   */
  getServerRegistry(): ServerRegistry {
    return this.serverRegistry;
  }

  /**
   * 获取负载均衡器
   */
  getLoadBalancer(): LoadBalancer {
    return this.loadBalancer;
  }
}