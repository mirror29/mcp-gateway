import { Request, Response, NextFunction } from 'express';

/**
 * API认证中间件
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 跳过健康检查等不需要认证的接口
  const skipAuthPaths = ['/health', '/api'];
  if (skipAuthPaths.some(path => req.path === path || req.path.startsWith(path))) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const apiSecret = req.headers['x-api-secret'] as string;

  const validApiKey = process.env.API_KEY;
  const validApiSecret = process.env.API_SECRET;

  // 如果环境变量中没有配置认证信息，则跳过认证（开发模式）
  if (!validApiKey && !validApiSecret) {
    console.warn('[Auth] 未配置API认证信息，跳过认证（开发模式）');
    return next();
  }

  // 验证API密钥
  if (validApiKey && apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'API密钥无效',
      },
    });
    return;
  }

  // 验证API密钥
  if (validApiSecret && apiSecret !== validApiSecret) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_SECRET',
        message: 'API密钥无效',
      },
    });
    return;
  }

  // 在请求对象中添加用户信息
  req.user = {
    id: `user_${apiKey || 'anonymous'}`,
    apiKey: apiKey || 'anonymous',
  };

  next();
};

/**
 * 扩展Request接口以包含用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        apiKey: string;
      };
    }
  }
}