import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsResolver } from './requests.resolver';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestsResolver]
})
export class RequestsModule {}
