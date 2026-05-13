import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OrganizationProfile } from "src/organizations/organization-profile.entity";
import { VolunteerRequest } from "src/requests/request.entity";
import { AdminDashboardResponse } from "../dto/admin-dashboard.response";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class AdminDashboardService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(VolunteerRequest) private requestRepo: Repository<VolunteerRequest>,
    @InjectRepository(OrganizationProfile) private orgRepo: Repository<OrganizationProfile>,
  ) {}

  async getStats(): Promise<AdminDashboardResponse> {
    const [totalUsers, pendingOrgs, totalRequests] = await Promise.all([
      this.usersService.countByRole(), // Скільки всього юзерів
      this.orgRepo.count({ where: { isVerified: false } }), // Скільки фондів чекають
      this.requestRepo.count(), // Скільки всього запитів на мапі
    ]);

    return { totalUsers, pendingOrganizations: pendingOrgs, totalRequests };
  }
}