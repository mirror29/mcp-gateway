import { Module } from '@nestjs/common';
import { BaziService } from './bazi.service';

/**
 * 八字算命模块
 */
@Module({
  providers: [BaziService],
  exports: [BaziService],
})
export class BaziModule {}