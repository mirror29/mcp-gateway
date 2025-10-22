import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GatewayModule } from './modules/gateway/gateway.module';
import { AuthModule } from './modules/auth/auth.module';
import { BaziModule } from './modules/bazi/bazi.module';
import { GatewayService } from './modules/gateway/gateway.service';
import { BaziService } from './modules/bazi/bazi.service';
import configuration from './config/configuration';

/**
 * 应用程序根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // 功能模块
    GatewayModule,
    AuthModule,
    BaziModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly baziService: BaziService,
  ) {}

  /**
   * 应用启动时注册所有MCP服务
   */
  onModuleInit() {
    console.log('📝 正在注册MCP服务...');
    this.gatewayService.registerServer('bazi', this.baziService);

    // 输出注册的服务
    const registry = this.gatewayService.getServerRegistry();
    const stats = registry.getStats();
    console.log(`✅ 已注册 ${stats.totalServers} 个服务，${stats.totalTools} 个工具`);
    console.log(`📋 服务列表: ${registry.getServerNames().join(', ')}`);

    // 设置定时输出统计信息
    setInterval(() => {
      const currentStats = registry.getStats();
      const statuses = registry.getAllServersStatus();

      console.log('\n📊 服务状态统计:');
      console.log(`   总服务数: ${currentStats.totalServers}`);
      console.log(`   在线服务: ${currentStats.onlineServers}`);
      console.log(`   离线服务: ${currentStats.offlineServers}`);
      console.log(`   总工具数: ${currentStats.totalTools}`);

      statuses.forEach(({ name, status }) => {
        const load = status.load ? ` (负载: ${status.load.activeRequests}/${status.load.totalRequests})` : '';
        console.log(`   ${name}: ${status.online ? '✅ 在线' : '❌ 离线'}${load}`);
      });
      console.log('');
    }, 60000); // 每分钟输出一次
  }
}