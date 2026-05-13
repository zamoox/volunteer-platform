import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VolunteerRequest } from './request.entity';
import { RequestsService } from './requests.service';
import { CreateVolunteerRequestInput } from './dto/create-request.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { PoliciesGuard } from 'src/casl/guards/policies.guards';
import { UpdateVolunteerRequestInput } from './dto/update-request.input';
import { CompleteRequestWithReviewInput } from './dto/complete-request-with-review.input';

@Resolver(() => VolunteerRequest)
export class RequestsResolver {
  constructor(private readonly requestsService: RequestsService) {}

  @Query(() => [VolunteerRequest])
  async getAllRequests(
    @Args('category', { nullable: true }) category?: string,
  ): Promise<VolunteerRequest[]> {
    return this.requestsService.findAll(category);
  }

  // Тільки ORGANIZATION може створити запит
  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async createRequest(
    @CurrentUser() user: JwtUser,
    @Args('input') input: CreateVolunteerRequestInput,
  ): Promise<VolunteerRequest> {
    return this.requestsService.create(user.id, input);
  }

  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async updateRequest(
    @CurrentUser() user: JwtUser,
    @Args('input') input: UpdateVolunteerRequestInput,
  ): Promise<VolunteerRequest> {
    return this.requestsService.update(input.id, input, user);
  }

  // Тільки VOLUNTEER може прийняти запит
  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async acceptRequest(
    @CurrentUser() user: JwtUser,
    @Args('requestId') requestId: string,
  ): Promise<VolunteerRequest> {
    return this.requestsService.acceptRequest(requestId, user.id);
  }

  // Організація або адмін змінюють статус
  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async updateRequestStatus(
    @CurrentUser() user: JwtUser,
    @Args('id') id: string,
    @Args('status') status: string,
  ): Promise<VolunteerRequest> {
    return this.requestsService.updateStatus(id, status, user);
  }

  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async completeRequestWithReview(
    @CurrentUser() user: JwtUser,
    @Args('input') input: CompleteRequestWithReviewInput,
  ): Promise<VolunteerRequest> {
    return this.requestsService.completeRequestWithReview(user, input);
  }

  @Query(() => [VolunteerRequest])
  @UseGuards(JwtAuthGuard)
  async getMyRequests(@CurrentUser() user: JwtUser) {
    return this.requestsService.getMyRequests(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  async deleteRequest(
    @CurrentUser() user: JwtUser,
    @Args('id') id: string,
  ) {
    return this.requestsService.deleteRequest(id, user);
  }
}