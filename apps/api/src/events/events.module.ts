import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}), // Required for AuthGuard
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
