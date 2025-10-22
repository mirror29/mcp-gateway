import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IMCPServer, ServerStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCP服务注册中心服务
 * 负责管理所有MCP服务的注册、发现和状态监控
 */
@Injectable()
export class ServerRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServerRegistryService.name);
  private servers = new Map<string, IMCPServer>();
  private serverStatuses = new Map<string, ServerStatus>();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.startHealthCheck();
  }

  onModuleDestroy() {
    this.stopHealthCheck();
  }

  /**
   * 注册MCP服务
   * @param name 服务名称
   * @param server 服务实例
   */
  register(name: string, server: IMCPServer): void {
    if (this.servers.has(name)) {
      this.logger.warn(`服务 '${name}' 已存在，将被覆盖`);
    }

    this.servers.set(name, server);
    this.serverStatuses.set(name, server.getStatus());
    this.logger.log(`已注册服务: ${name} (版本: ${server.version})`);
  }

  /**
   * 注销服务
   * @param name 服务名称
   */
  unregister(name: string): void {
    if (this.servers.delete(name)) {
      this.serverStatuses.delete(name);
      this.logger.log(`已注销服务: ${name}`);
    }
  }

  /**
   * 获取服务实例
   * @param name 服务名称
   * @returns 服务实例
   */
  getServer(name: string): IMCPServer {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP服务 '${name}' 未找到。可用服务: ${this.getServerNames().join(', ')}`);
    }
    return server;
  }

  /**
   * 获取服务状态
   * @param name 服务名称
   * @returns 服务状态
   */
  getServerStatus(name: string): ServerStatus | null {
    return this.serverStatuses.get(name) || null;
  }

  /**
   * 获取所有服务状态
   * @returns 所有服务状态列表
   */
  getAllServersStatus(): Array<{ name: string; status: ServerStatus; tools: string[] }> {
    return Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      status: this.serverStatuses.get(name) || server.getStatus(),
      tools: server.tools,
    }));
  }

  /**
   * 获取服务名称列表
   * @returns 服务名称数组
   */
  getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * 获取可用服务列表
   * @returns 在线服务列表
   */
  getAvailableServers(): string[] {
    return Array.from(this.servers.entries())
      .filter(([_, server]) => server.getStatus().online)
      .map(([name, _]) => name);
  }

  /**
   * 检查服务是否存在
   * @param name 服务名称
   * @returns 是否存在
   */
  hasServer(name: string): boolean {
    return this.servers.has(name);
  }

  /**
   * 执行工具
   * @param serverName 服务名称
   * @param toolName 工具名称
   * @param params 参数
   * @returns 执行结果
   */
  async executeTool(serverName: string, toolName: string, params: any): Promise<any> {
    const startTime = Date.now();
    const server = this.getServer(serverName);

    try {
      // 更新服务状态
      const status = server.getStatus();
      if (!status.online) {
        throw new Error(`服务 '${serverName}' 当前不可用`);
      }

      // 执行工具
      const result = await server.executeTool(toolName, params);

      // 更新执行时间
      const responseTime = Date.now() - startTime;
      this.updateServerStatus(serverName, { ...status, responseTime });

      return result;
    } catch (error) {
      // 更新错误状态
      const status = server.getStatus();
      this.updateServerStatus(serverName, {
        ...status,
        online: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 更新服务状态
   * @param name 服务名称
   * @param status 新状态
   */
  private updateServerStatus(name: string, status: ServerStatus): void {
    this.serverStatuses.set(name, status);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    // 每30秒检查一次服务健康状态
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    this.logger.log('已启动健康检查 (间隔: 30秒)');
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const checkPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        const isHealthy = await server.healthCheck();
        const currentStatus = this.serverStatuses.get(name);

        if (currentStatus) {
          const newStatus: ServerStatus = {
            ...currentStatus,
            online: isHealthy,
            lastUpdate: new Date(),
            error: isHealthy ? undefined : '健康检查失败',
          };
          this.updateServerStatus(name, newStatus);
        }
      } catch (error) {
        this.logger.error(`服务 '${name}' 健康检查失败:`, error);

        const currentStatus = this.serverStatuses.get(name);
        if (currentStatus) {
          this.updateServerStatus(name, {
            ...currentStatus,
            online: false,
            lastUpdate: new Date(),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    await Promise.allSettled(checkPromises);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.log('已停止健康检查');
    }
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats(): {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    totalTools: number;
  } {
    const statuses = Array.from(this.serverStatuses.values());
    const onlineCount = statuses.filter(status => status.online).length;
    const totalTools = Array.from(this.servers.values())
      .reduce((total, server) => total + server.tools.length, 0);

    return {
      totalServers: this.servers.size,
      onlineServers: onlineCount,
      offlineServers: this.servers.size - onlineCount,
      totalTools,
    };
  }
}