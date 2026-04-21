import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsResolver } from './requests.resolver';
import { VolunteerRequest } from './request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerRequest]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsResolver]
})
export class RequestsModule {}
