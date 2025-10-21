import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * 请求参数验证中间件
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // 只验证 POST 请求的 body 参数
  if (req.method !== 'POST') {
    return next();
  }

  // 基础参数验证
  const schema = Joi.object({
    // 基础字段验证
    birthDate: Joi.string().isoDate().optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    calendarType: Joi.string().valid('solar', 'lunar').optional(),

    // 嵌套对象验证（用于配对分析）
    person1: Joi.object({
      birthDate: Joi.string().isoDate().required(),
      gender: Joi.string().valid('male', 'female').required(),
      calendarType: Joi.string().valid('solar', 'lunar').required(),
    }).optional(),

    person2: Joi.object({
      birthDate: Joi.string().isoDate().required(),
      gender: Joi.string().valid('male', 'female').required(),
      calendarType: Joi.string().valid('solar', 'lunar').required(),
    }).optional(),

    // 其他可选参数
    timezone: Joi.string().optional(),
    targetType: Joi.string().valid('today', 'month', 'year').optional(),
    targetDate: Joi.string().isoDate().optional(),
    analysisType: Joi.string().valid('love', 'business', 'friendship').optional(),
  }).unknown(true); // 允许未知字段，以便向后兼容

  const { error } = schema.validate(req.body);

  if (error) {
    const requestId = req.headers['x-request-id'] as string || 'unknown';

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      },
      meta: {
        requestId,
        timestamp: new Date(),
      },
    });
  }

  next();
};