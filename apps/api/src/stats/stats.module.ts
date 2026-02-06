import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
