import { Controller, Get } from '@nestjs/common';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  getAll() {
    return this.requestsService.findAll();
  }
}