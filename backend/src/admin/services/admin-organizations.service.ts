import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { ModerationAction } from '../entities/moderation-action.enum';

@Injectable()
export class AdminOrganizationsService {
  constructor(
    @InjectRepository(OrganizationProfile) private orgRepo: Repository<OrganizationProfile>,
    @InjectRepository(AdminLog) private logRepo: Repository<AdminLog>,
  ) {}

  async findAll() {
    return this.orgRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async verify(orgId: string, adminId: string) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Організацію не знайдено');

    org.isVerified = true;
    await this.orgRepo.save(org);

    await this.logRepo.save({
      adminId,
      action: ModerationAction.VERIFY_ORG,
      targetId: orgId,
      reason: 'Верифіковано адміністратором',
    });

    return org;
  }
}