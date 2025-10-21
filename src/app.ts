import dotenv from 'dotenv';
import { MCPGateway } from '@/gateway/MCPGateway';
import { BaziServer } from '@/servers/BaziServer';

// 加载环境变量
dotenv.config();

/**
 * 应用程序入口点
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 正在启动 MCP 网关服务器...');
    console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API认证: ${process.env.API_KEY ? '已启用' : '已禁用（开发模式）'}`);

    // 创建网关实例
    const gateway = new MCPGateway();

    // 注册MCP服务
    console.log('📝 正在注册MCP服务...');
    gateway.registerServer('bazi', new BaziServer());

    // 输出注册的服务
    const registry = gateway.getServerRegistry();
    const stats = registry.getStats();
    console.log(`✅ 已注册 ${stats.totalServers} 个服务，${stats.totalTools} 个工具`);
    console.log(`📋 服务列表: ${registry.getServerNames().join(', ')}`);

    // 启动服务器
    await gateway.start();

    console.log('🎉 MCP 网关服务器启动成功！');

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