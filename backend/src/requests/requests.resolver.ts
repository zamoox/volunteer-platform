import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VolunteerRequest } from './request.entity';
import { RequestsService } from './requests.service';
import { CreateVolunteerRequestInput } from './dto/create-request.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { PoliciesGuard } from 'src/casl/guards/policies.guards';

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
  @Roles(UserRole.ORGANIZATION)
  async createRequest(
    @CurrentUser() user: JwtUser,
    @Args('input') input: CreateVolunteerRequestInput,
  ): Promise<VolunteerRequest> {
    return this.requestsService.create(user.userId, input);
  }

  // Тільки VOLUNTEER може прийняти запит
  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Roles(UserRole.VOLUNTEER)
  async acceptRequest(
    @CurrentUser() user: JwtUser,
    @Args('requestId') requestId: string,
  ): Promise<VolunteerRequest> {
    return this.requestsService.acceptRequest(requestId, user.userId);
  }

  // Організація або адмін змінюють статус
  @Mutation(() => VolunteerRequest)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Roles(UserRole.ORGANIZATION, UserRole.ADMIN)
  async updateRequestStatus(
    @CurrentUser() user: JwtUser,
    @Args('id') id: string,
    @Args('status') status: string,
  ): Promise<VolunteerRequest> {
    return this.requestsService.updateStatus(id, status, user);
  }
}