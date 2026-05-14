import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { AdminOrganizationsService } from '../services/admin-organizations.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/casl/guards/policies.guards';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Action } from 'src/casl/enums/actions.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';

@Resolver(() => OrganizationProfile)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AdminOrganizationsResolver {
  constructor(private readonly adminOrgsService: AdminOrganizationsService) {}

  @Query(() => [OrganizationProfile], { name: 'adminGetAllOrganizations' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async findAll() {
    return this.adminOrgsService.findAll();
  }

  @Mutation(() => OrganizationProfile, { name: 'adminVerifyOrganization' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async verifyOrganization(
    @Args('id') id: string,
    @CurrentUser() admin: JwtUser,
  ) {
    return this.adminOrgsService.verify(id, admin.id);
  }
}