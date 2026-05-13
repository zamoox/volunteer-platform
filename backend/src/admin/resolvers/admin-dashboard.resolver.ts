import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/casl/guards/policies.guards';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Action } from 'src/casl/enums/actions.enum';
import { AdminDashboardResponse } from '../dto/admin-dashboard.response';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Resolver()
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AdminDashboardResolver {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Query(() => AdminDashboardResponse, { name: 'adminGetDashboardStats' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async getStats() {
    return this.dashboardService.getStats();
  }
}