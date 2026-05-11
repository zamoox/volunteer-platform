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
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';
import { User } from 'src/users/user.entity';
import { AbilityFactory } from 'src/casl/factories/ability.factory';
import { Action } from 'src/casl/enums/actions.enum';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(VolunteerRequest)
    private readonly requestRepository: Repository<VolunteerRequest>,
    private readonly orgsService: OrganizationProfileService,
    private readonly caslAbilityFactory: AbilityFactory,
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

  async updateStatus(id: string, status: string, currentUser: JwtUser): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOne({ where: { id } });
    
    if (!request) {
      throw new NotFoundException('Запит не знайдено');
    }

    // Створюємо тимчасовий об'єкт юзера для CASL (якщо у тебе JwtUser відрізняється від UserEntity)
    const userEntity = new User();
    userEntity.id = currentUser.userId;
    userEntity.role = currentUser.role as UserRole;

    const ability = this.caslAbilityFactory.createForUser(userEntity);

    // CASL автоматично перевірить умову { authorId: user.id }, яку ми прописали у фабриці
    // Для об'єкта 'request' він порівняє його властивість authorId з id нашого юзера
    if (ability.cannot(Action.Update, request)) {
      throw new ForbiddenException('Ви можете змінювати статус тільки власних запитів');
    }

    request.status = status as RequestStatus;
    return this.requestRepository.save(request);
  }
}