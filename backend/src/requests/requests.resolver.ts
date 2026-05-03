import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RequestsService } from './requests.service';
import { VolunteerRequest } from './request.entity';
import { CreateVolunteerRequestInput } from './dto/create-request.input';

@Resolver(() => VolunteerRequest)
export class RequestsResolver {
  constructor(private readonly requestsService: RequestsService) {}

  @Query(() => [VolunteerRequest], { name: 'getAllRequests' })
  async getAllRequests(
    @Args('category', { type: () => String, nullable: true }) category?: string,
  ) {
    return this.requestsService.findAll(category);
  }

  @Mutation(() => VolunteerRequest)
  async createRequest(
    @Args('input') input: CreateVolunteerRequestInput,
  ) {
    return this.requestsService.create(input); // Зараз створимо цей метод у сервісі
  }

  @Mutation(() => VolunteerRequest)
  async updateRequestStatus(
    @Args('id') id: string,
    @Args('status') status: string,
  ) {
    return this.requestsService.updateStatus(id, status);
  }
  
}

