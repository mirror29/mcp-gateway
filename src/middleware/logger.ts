import { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  const startTime = Date.now();

  // 记录请求开始
  console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - 开始处理`);

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || 'anonymous';

    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) [${userId}]`);
  });

  next();
};