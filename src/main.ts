import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

/**
 * 应用程序启动入口
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 正在启动 NestJS MCP 网关服务器...');
    console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API认证: ${process.env.API_KEY ? '已启用' : '已禁用（开发模式）'}`);

    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // 全局中间件
    app.use(helmet());
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    app.use(morgan('combined'));

    // 全局管道和过滤器
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    // 配置 Swagger 文档
    const config = new DocumentBuilder()
      .setTitle('MCP Gateway API')
      .setDescription('专属MCP网关服务器 API 文档')
      .setVersion('1.0.0')
      .addApiKey(
        { type: 'apiKey', name: 'x-api-key', in: 'header' },
        'api-key',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // 启动服务器
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen(port, host);

    console.log(`🚀 NestJS MCP 网关服务器已启动`);
    console.log(`📍 地址: http://${host}:${port}`);
    console.log(`🏥 健康检查: http://${host}:${port}/health`);
    console.log(`📊 服务状态: http://${host}:${port}/api/mcp/status`);
    console.log(`📖 API文档: http://${host}:${port}/api`);
    console.log(`📚 Swagger文档: http://${host}:${port}/api/docs`);

  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  console.error('   Promise:', promise);
  process.exit(1);
});

// 启动应用
bootstrap();