import { Request, Response, NextFunction } from 'express';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  console.error(`[${new Date().toISOString()}] [${requestId}] 未处理的错误:`, {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'anonymous',
  });

  // 不要在生产环境中暴露错误堆栈
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误',
      ...(isDevelopment && {
        details: error.message,
        stack: error.stack,
      }),
    },
    meta: {
      requestId,
      timestamp: new Date(),
    },
  });
};