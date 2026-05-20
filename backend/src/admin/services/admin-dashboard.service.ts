import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OrganizationProfile } from "src/organizations/organization-profile.entity";
import { VolunteerRequest } from "src/requests/request.entity";
import { AdminDashboardResponse, ChartDataPoint } from "../dto/admin-dashboard.response";
import { UsersService } from "src/users/users.service";
import { Repository, MoreThanOrEqual } from "typeorm";
import { OrganizationStatus } from "src/organizations/enums/organization-status.enum";

@Injectable()
export class AdminDashboardService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(VolunteerRequest) private requestRepo: Repository<VolunteerRequest>,
    @InjectRepository(OrganizationProfile) private orgRepo: Repository<OrganizationProfile>,
  ) {}

  async getStats(): Promise<AdminDashboardResponse> {
    const [totalUsers, pendingOrgs, totalRequests] = await Promise.all([
      this.usersService.countByRole(),
      this.orgRepo.count({ where: { status: OrganizationStatus.PENDING } }),
      this.requestRepo.count(),
    ]);

    const activityChart = await this.getActivityStats();

    return { 
      totalUsers, 
      pendingOrganizations: pendingOrgs, 
      totalRequests,
      activityChart 
    };
  }

  private async getActivityStats(): Promise<ChartDataPoint[]> {
    const days = 7;
    const chartData: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await this.requestRepo.count({
        where: {
          createdAt: MoreThanOrEqual(date),
        }
      });

      chartData.push({
        date: `${date.getDate()}.${date.getMonth() + 1}`,
        count
      });
    }

    return chartData;
  }
}