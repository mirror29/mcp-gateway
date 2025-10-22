import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { GatewayService } from './gateway.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * DTO 类型定义
 */
interface ExecuteToolDto {
  [key: string]: any;
}

/**
 * 网关控制器
 */
@ApiTags('MCP网关')
@Controller('api/mcp')
@UseGuards(ApiKeyGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * 获取所有服务状态
   */
  @Get('status')
  @ApiOperation({ summary: '获取所有MCP服务状态' })
  @ApiResponse({ status: 200, description: '成功获取服务状态' })
  @ApiResponse({ status: 401, description: 'API Key 无效' })
  async getStatus() {
    try {
      const services = this.gatewayService.getAllServersStatus();
      const statistics = this.gatewayService.getStats();

      return {
        success: true,
        data: {
          services,
          statistics,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 'GET_STATUS_FAILED',
          message: error instanceof Error ? error.message : '获取服务状态失败',
        },
      });
    }
  }

  /**
   * 获取服务列表
   */
  @Get('servers')
  @ApiOperation({ summary: '获取MCP服务列表' })
  @ApiResponse({ status: 200, description: '成功获取服务列表' })
  @ApiResponse({ status: 401, description: 'API Key 无效' })
  async getServers() {
    try {
      const servers = this.gatewayService.getServerNames();
      return {
        success: true,
        data: { servers },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 'LIST_SERVERS_FAILED',
          message: error instanceof Error ? error.message : '获取服务列表失败',
        },
      });
    }
  }

  /**
   * 获取指定服务的工具列表
   */
  @Get('servers/:serverName/tools')
  @ApiOperation({ summary: '获取指定MCP服务的工具列表' })
  @ApiParam({ name: 'serverName', description: '服务名称' })
  @ApiResponse({ status: 200, description: '成功获取工具列表' })
  @ApiResponse({ status: 401, description: 'API Key 无效' })
  @ApiResponse({ status: 404, description: '服务未找到' })
  async getServerTools(@Param('serverName') serverName: string) {
    try {
      if (!serverName) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '服务名称不能为空',
          },
        });
      }

      const tools = this.gatewayService.getServerTools(serverName);
      return {
        success: true,
        data: tools,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('未找到')) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `MCP服务 '${serverName}' 未找到`,
            details: {
              availableServers: this.gatewayService.getServerNames(),
            },
          },
        });
      }

      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 'LIST_TOOLS_FAILED',
          message: error instanceof Error ? error.message : '获取工具列表失败',
        },
      });
    }
  }

  /**
   * 执行MCP工具 - 核心接口
   */
  @Post(':serverName/:toolName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行MCP工具' })
  @ApiParam({ name: 'serverName', description: '服务名称' })
  @ApiParam({ name: 'toolName', description: '工具名称' })
  @ApiHeader({ name: 'x-request-id', description: '请求ID（可选）', required: false })
  @ApiResponse({ status: 200, description: '工具执行成功' })
  @ApiResponse({ status: 400, description: '请求参数无效' })
  @ApiResponse({ status: 401, description: 'API Key 无效' })
  @ApiResponse({ status: 404, description: '服务或工具未找到' })
  @ApiResponse({ status: 503, description: '服务不可用' })
  async executeTool(
    @Param('serverName') serverName: string,
    @Param('toolName') toolName: string,
    @Body() params: ExecuteToolDto,
    @Headers('x-request-id') requestIdHeader?: string,
  ) {
    const startTime = Date.now();
    const requestId = requestIdHeader || uuidv4();

    try {
      // 参数验证
      if (!serverName || !toolName) {
        throw new BadRequestException({
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

      // 验证服务存在
      if (!this.gatewayService.hasServer(serverName)) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `MCP服务 '${serverName}' 未找到`,
            details: {
              availableServers: this.gatewayService.getServerNames(),
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
      const serverStatus = this.gatewayService.getServerStatus(serverName);
      if (!serverStatus?.online) {
        throw new ServiceUnavailableException({
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
      const result = await this.gatewayService.executeTool(serverName, toolName, params);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        meta: {
          requestId,
          timestamp: new Date(),
          executionTime,
          serverName,
          toolName,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // 如果是我们主动抛出的异常，直接重新抛出
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      // 处理其他未知错误
      console.error(`[GatewayController] 执行工具失败 (${serverName}.${toolName}):`, error);

      throw new InternalServerErrorException({
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
  }
}