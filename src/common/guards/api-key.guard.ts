import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * API Key 认证守卫
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.configService.get<string>('app.apiKey');

    // 如果没有配置 API Key，则跳过认证（开发模式）
    if (!apiKey) {
      return true;
    }

    const requestApiKey = request.headers['x-api-key'] as string;

    if (!requestApiKey || requestApiKey !== apiKey) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API Key 无效或缺失',
        },
      });
    }

    return true;
  }
}