import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolunteerRequest, RequestStatus } from './request.entity';
import { UserRole } from '../enums/user-role.enum';
import { OrganizationProfileService } from '../organizations/organization-profile.service';
import { CreateVolunteerRequestInput } from './dto/create-request.input';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(VolunteerRequest)
    private readonly requestRepository: Repository<VolunteerRequest>,
    private readonly orgsService: OrganizationProfileService,
  ) {}

  async create(userId: string, input: CreateVolunteerRequestInput): Promise<VolunteerRequest> {
    const org = await this.orgsService.findByUserId(userId);
    if (!org) {
      throw new ForbiddenException(
        'Спочатку створіть профіль організації через createOrganizationProfile',
      );
    }

    const request = this.requestRepository.create({
      ...input,
      organizationId: org.id,
      status: RequestStatus.OPEN,
    });

    return this.requestRepository.save(request);
  }

  async findAll(category?: string): Promise<VolunteerRequest[]> {
    if (category) {
      return this.requestRepository.find({ where: { category } });
    }
    return this.requestRepository.find();
  }

  async findOneById(id: string): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['organization', 'volunteer'],
    });
    if (!request) throw new NotFoundException(`Запит з id=${id} не знайдено`);
    return request;
  }

  async acceptRequest(requestId: string, volunteerId: string): Promise<VolunteerRequest> {
    const request = await this.findOneById(requestId);

    if (request.status !== RequestStatus.OPEN) {
      throw new ForbiddenException('Цей запит вже не доступний');
    }

    request.volunteerId = volunteerId;
    request.status = RequestStatus.IN_PROGRESS;
    return this.requestRepository.save(request);
  }

  async updateStatus(
    requestId: string,
    status: string,
    userId: string,
    role: UserRole,
  ): Promise<VolunteerRequest> {
    const request = await this.findOneById(requestId);

    const org = await this.orgsService.findByUserId(userId);
    const isOwner = org && request.organization === org;
    const isAdmin = role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Немає прав для зміни цього запиту');
    }

    request.status = status as RequestStatus;
    return this.requestRepository.save(request);
  }
}