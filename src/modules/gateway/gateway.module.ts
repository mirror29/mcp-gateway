import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ServerRegistryService } from './server-registry.service';
import { LoadBalancerService } from './load-balancer.service';

/**
 * 网关模块
 */
@Module({
  controllers: [GatewayController],
  providers: [
    GatewayService,
    ServerRegistryService,
    LoadBalancerService,
  ],
  exports: [
    GatewayService,
    ServerRegistryService,
    LoadBalancerService,
  ],
})
export class GatewayModule {}