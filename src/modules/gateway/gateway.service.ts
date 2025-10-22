import { Injectable, Logger } from '@nestjs/common';
import { ServerRegistryService } from './server-registry.service';
import { LoadBalancerService, LoadBalancingStrategy } from './load-balancer.service';
import { IMCPServer } from '../../types';

/**
 * 网关服务
 * 统一管理和路由所有MCP服务请求
 */
@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly serverRegistry: ServerRegistryService,
    private readonly loadBalancer: LoadBalancerService,
  ) {}

  /**
   * 注册MCP服务
   * @param name 服务名称
   * @param server 服务实例
   */
  registerServer(name: string, server: IMCPServer): void {
    this.serverRegistry.register(name, server);
    this.logger.log(`已注册MCP服务: ${name}`);
  }

  /**
   * 注销MCP服务
   * @param name 服务名称
   */
  unregisterServer(name: string): void {
    this.serverRegistry.unregister(name);
    this.logger.log(`已注销MCP服务: ${name}`);
  }

  /**
   * 执行MCP工具
   * @param serverName 服务名称
   * @param toolName 工具名称
   * @param params 参数
   * @returns 执行结果
   */
  async executeTool(serverName: string, toolName: string, params: any): Promise<any> {
    this.logger.debug(`执行工具: ${serverName}.${toolName}`, params);

    try {
      const result = await this.serverRegistry.executeTool(serverName, toolName, params);
      this.logger.debug(`工具执行成功: ${serverName}.${toolName}`);
      return result;
    } catch (error) {
      this.logger.error(`工具执行失败: ${serverName}.${toolName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有服务状态
   * @returns 所有服务状态
   */
  getAllServersStatus() {
    return this.serverRegistry.getAllServersStatus();
  }

  /**
   * 获取服务列表
   * @returns 服务名称列表
   */
  getServerNames(): string[] {
    return this.serverRegistry.getServerNames();
  }

  /**
   * 获取指定服务的工具列表
   * @param serverName 服务名称
   * @returns 工具列表
   */
  getServerTools(serverName: string): {
    serverName: string;
    version: string;
    tools: string[];
    description: string;
  } {
    const server = this.serverRegistry.getServer(serverName);
    return {
      serverName,
      version: server.version,
      tools: server.tools,
      description: server.description,
    };
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats() {
    return this.serverRegistry.getStats();
  }

  /**
   * 检查服务是否存在
   * @param serverName 服务名称
   * @returns 是否存在
   */
  hasServer(serverName: string): boolean {
    return this.serverRegistry.hasServer(serverName);
  }

  /**
   * 获取服务状态
   * @param serverName 服务名称
   * @returns 服务状态
   */
  getServerStatus(serverName: string) {
    return this.serverRegistry.getServerStatus(serverName);
  }

  /**
   * 设置负载均衡策略
   * @param strategy 负载均衡策略
   */
  setLoadBalancingStrategy(strategy: LoadBalancingStrategy): void {
    this.loadBalancer.setStrategy(strategy);
  }

  /**
   * 获取负载均衡策略
   * @returns 当前负载均衡策略
   */
  getLoadBalancingStrategy(): LoadBalancingStrategy {
    return this.loadBalancer.getStrategy();
  }

  /**
   * 获取服务注册中心实例
   * @returns 服务注册中心
   */
  getServerRegistry(): ServerRegistryService {
    return this.serverRegistry;
  }

  /**
   * 获取负载均衡器实例
   * @returns 负载均衡器
   */
  getLoadBalancer(): LoadBalancerService {
    return this.loadBalancer;
  }
}