import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolunteerRequest } from 'src/requests/request.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { ModerationAction } from '../entities/moderation-action.enum';

@Injectable()
export class AdminRequestsService {
  constructor(
    @InjectRepository(VolunteerRequest) private requestRepo: Repository<VolunteerRequest>,
    @InjectRepository(AdminLog) private logRepo: Repository<AdminLog>,
  ) {}

  async findAll() {
    return this.requestRepo.find({
      relations: ['organization', 'organization.user', 'volunteer', 'volunteer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async delete(requestId: string, adminId: string, reason: string) {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Запит не знайдено');

    await this.requestRepo.remove(request);

    await this.logRepo.save({
      adminId,
      action: ModerationAction.DELETE_REQUEST,
      targetId: requestId,
      reason,
    });

    return true;
  }
}