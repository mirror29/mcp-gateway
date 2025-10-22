import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志拦截器
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const now = Date.now();

    // 记录请求开始
    this.logger.log(`[${method}] ${url} - ${ip} ${userAgent}`);

    return next
      .handle()
      .pipe(
        tap({
          next: (data) => {
            const responseTime = Date.now() - now;
            this.logger.log(`[${method}] ${url} - ${responseTime}ms - 200`);
          },
          error: (error) => {
            const responseTime = Date.now() - now;
            this.logger.error(`[${method}] ${url} - ${responseTime}ms - ${error.status || 500} - ${error.message}`);
          },
        }),
      );
  }
}