import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/casl/guards/policies.guards';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Action } from 'src/casl/enums/actions.enum';
import { VolunteerRequest } from 'src/requests/request.entity';
import { AdminRequestsService } from '../services/admin-requests.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';

@Resolver(() => VolunteerRequest)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AdminRequestsResolver {
  constructor(private readonly adminRequestsService: AdminRequestsService) {}

  @Query(() => [VolunteerRequest], { name: 'adminGetAllRequests' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async findAll() {
    return this.adminRequestsService.findAll();
  }

  @Mutation(() => Boolean, { name: 'adminDeleteRequest' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async deleteRequest(
    @Args('id') id: string,
    @Args('reason') reason: string,
    @CurrentUser() admin: JwtUser,
  ) {
    return this.adminRequestsService.delete(id, admin.id, reason);
  }
}