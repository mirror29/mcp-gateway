import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * 应用程序根控制器
 */
@ApiTags('应用信息')
@Controller()
export class AppController {
  /**
   * 获取API信息
   */
  @Get('/api')
  @ApiOperation({ summary: '获取API信息' })
  getApiInfo() {
    return {
      success: true,
      data: {
        name: 'MCP Gateway',
        version: '1.0.0',
        description: '专属MCP网关服务器 - NestJS版本',
        framework: 'NestJS',
        endpoints: {
          health: '/health',
          status: '/api/mcp/status',
          execute: '/api/mcp/:serverName/:toolName',
          listServers: '/api/mcp/servers',
          listTools: '/api/mcp/servers/:serverName/tools',
        },
      },
    };
  }

  /**
   * 健康检查
   */
  @Get('/health')
  @ApiOperation({ summary: '健康检查' })
  getHealth() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }
}