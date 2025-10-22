import { Injectable, Logger } from '@nestjs/common';
import { IMCPServer } from '../../types';

/**
 * 负载均衡策略枚举
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  LEAST_CONNECTIONS = 'least_connections',
}

/**
 * 负载均衡器服务
 * 用于在多个服务实例间分配请求
 */
@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private strategy: LoadBalancingStrategy;
  private roundRobinIndex = 0;

  constructor() {
    this.strategy = LoadBalancingStrategy.ROUND_ROBIN;
  }

  /**
   * 选择最佳服务实例
   * @param servers 服务实例列表
   * @returns 选中的服务实例
   */
  selectServer(servers: IMCPServer[]): IMCPServer {
    if (servers.length === 0) {
      throw new Error('没有可用的服务实例');
    }

    // 过滤在线的服务
    const availableServers = servers.filter(server => server.getStatus().online);
    if (availableServers.length === 0) {
      throw new Error('没有在线的服务实例');
    }

    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(availableServers);
      case LoadBalancingStrategy.RANDOM:
        return this.selectRandom(availableServers);
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(availableServers);
      default:
        // 确保返回有效的服务实例
        return availableServers[0]!;
    }
  }

  /**
   * 轮询策略选择
   * @param servers 可用服务列表
   * @returns 选中的服务
   */
  private selectRoundRobin(servers: IMCPServer[]): IMCPServer {
    if (servers.length === 0) {
      throw new Error('没有可用的服务实例');
    }
    const server = servers[this.roundRobinIndex % servers.length]!;
    this.roundRobinIndex++;
    return server;
  }

  /**
   * 随机策略选择
   * @param servers 可用服务列表
   * @returns 选中的服务
   */
  private selectRandom(servers: IMCPServer[]): IMCPServer {
    if (servers.length === 0) {
      throw new Error('没有可用的服务实例');
    }
    const randomIndex = Math.floor(Math.random() * servers.length);
    return servers[randomIndex]!;
  }

  /**
   * 最少连接策略选择
   * @param servers 可用服务列表
   * @returns 选中的服务
   */
  private selectLeastConnections(servers: IMCPServer[]): IMCPServer {
    if (servers.length === 0) {
      throw new Error('没有可用的服务实例');
    }
    return servers.reduce((least, current) => {
      const leastConnections = least.getStatus().load?.activeRequests || 0;
      const currentConnections = current.getStatus().load?.activeRequests || 0;
      return currentConnections < leastConnections ? current : least;
    });
  }

  /**
   * 设置负载均衡策略
   * @param strategy 新策略
   */
  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
    this.roundRobinIndex = 0; // 重置轮询索引
    this.logger.log(`负载均衡策略已更改为: ${strategy}`);
  }

  /**
   * 获取当前策略
   * @returns 当前策略
   */
  getStrategy(): LoadBalancingStrategy {
    return this.strategy;
  }
}