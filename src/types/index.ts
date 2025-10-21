/**
 * MCP网关核心类型定义
 */

/**
 * MCP服务接口
 */
export interface IMCPServer {
  /** 服务名称 */
  name: string;
  /** 服务版本 */
  version: string;
  /** 服务描述 */
  description: string;
  /** 支持的工具列表 */
  tools: string[];
  /** 服务状态 */
  status: ServerStatus;

  /**
   * 执行工具
   * @param toolName 工具名称
   * @param params 参数
   * @returns 执行结果
   */
  executeTool(toolName: string, params: any): Promise<any>;

  /**
   * 获取服务状态
   * @returns 服务状态
   */
  getStatus(): ServerStatus;

  /**
   * 健康检查
   * @returns 是否健康
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 服务状态
 */
export interface ServerStatus {
  /** 是否在线 */
  online: boolean;
  /** 最后更新时间 */
  lastUpdate: Date;
  /** 响应时间 */
  responseTime?: number;
  /** 错误信息 */
  error?: string;
  /** 负载情况 */
  load?: {
    activeRequests: number;
    totalRequests: number;
  };
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** 元数据 */
  meta?: {
    requestId: string;
    timestamp: Date;
    executionTime: number;
    serverName: string;
    toolName: string;
  };
}

/**
 * 请求上下文
 */
export interface RequestContext {
  /** 请求ID */
  requestId: string;
  /** 服务名称 */
  serverName: string;
  /** 工具名称 */
  toolName: string;
  /** 请求参数 */
  params: any;
  /** 请求时间 */
  requestTime: Date;
  /** 用户信息 */
  user?: {
    id: string;
    apiKey: string;
  };
}

/**
 * 中间件函数
 */
export type MiddlewareFunction = (req: any, res: any, next: any) => void | Promise<void>;

/**
 * 工具定义
 */
export interface ToolDefinition {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 参数schema */
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP服务配置
 */
export interface MCPServerConfig {
  /** 服务名称 */
  name: string;
  /** 服务类型 */
  type: 'http' | 'stdio' | 'builtin';
  /** 端点URL (HTTP类型) */
  endpoint?: string;
  /** 命令行 (stdio类型) */
  command?: string;
  /** 参数 */
  args?: string[];
  /** 环境变量 */
  env?: Record<string, string>;
  /** 超时时间 */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 是否启用 */
  enabled: boolean;
}