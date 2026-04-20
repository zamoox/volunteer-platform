import { Resolver, Query } from '@nestjs/graphql';
import { RequestsService } from './requests.service';
import { VolunteerRequest } from './request.entity';

@Resolver(() => VolunteerRequest)
export class RequestsResolver {
  constructor(private readonly requestsService: RequestsService) {}

  @Query(() => [VolunteerRequest], { name: 'getAllRequests' })
  async getRequests() {
    return this.requestsService.findAll();
  }
}