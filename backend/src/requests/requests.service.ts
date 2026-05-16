import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { VolunteerRequest } from './request.entity';
import { RequestStatus } from './enums/request-status.enum';
import { UserRole } from '../enums/user-role.enum';
import { OrganizationProfileService } from '../organizations/organization-profile.service';
import { CreateRequestInput } from './dto/create-request.input';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';
import { User } from 'src/users/user.entity';
import { AbilityFactory } from 'src/casl/factories/ability.factory';
import { Action } from 'src/casl/enums/actions.enum';
import { UpdateRequestInput } from './dto/update-request.input';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity';
import { CompleteRequestWithReviewInput } from './dto/complete-request-with-review.input';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';

const REQUEST_RELATIONS = [
  'organization',
  'organization.user',
  'volunteer',
  'volunteer.user',
  'review',
] as const;

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(VolunteerRequest)
    private readonly requestRepository: Repository<VolunteerRequest>,
    @InjectRepository(VolunteerProfile)
    private readonly volunteerProfileRepository: Repository<VolunteerProfile>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly orgsService: OrganizationProfileService,
    private readonly caslAbilityFactory: AbilityFactory,
  ) {}

  async create(userId: string, input: CreateRequestInput): Promise<VolunteerRequest> {
    const org = await this.orgsService.findByUserId(userId);
    if (!org) {
      throw new ForbiddenException(
        'Спочатку створіть профіль організації через createOrganizationProfile',
      );
    }

    if (!org.user) {
      const orgWithUser = await this.requestRepository.manager.findOne(
        OrganizationProfile,
        {
          where: { id: org.id },
          relations: ['user'],
        },
      );
      if (!orgWithUser?.user) {
        throw new NotFoundException('Користувача організації не знайдено');
      }
      org.user = orgWithUser.user;
    }

    const { coords, ...restInput } = input;

    const request = this.requestRepository.create({
      ...restInput,
      organizationId: org.id,
      status: input.status || RequestStatus.OPEN,
      // Формуємо валідний GeoJSON Point для бази даних
      location: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat], 
      },
    });

    const savedRequest = await this.requestRepository.save(request);
    savedRequest.organization = org;

    return this.findOneById(savedRequest.id);
  }

  async update(id: string, input: UpdateRequestInput, currentUser: JwtUser): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOne({ 
      where: { id },
      relations: ['organization', 'organization.user'] 
    });

    if (!request) throw new NotFoundException('Запит не знайдено');

    const userEntity = new User();
    userEntity.id = currentUser.id;
    userEntity.role = currentUser.role as UserRole;

    const ability = this.caslAbilityFactory.createForUser(userEntity);

    if (ability.cannot(Action.Update, request)) {
      throw new ForbiddenException('Ви можете редагувати тільки власні запити');
    }

    // Деструктуризуємо інпут, щоб окремо обробити зміну гео-координат
    const { coords, ...restInput } = input;

    // Оновлюємо плоскі поля
    Object.assign(request, restInput);

    // Якщо фронтенд передав нові координати, оновлюємо структуру PostGIS
    if (coords) {
      request.location = {
        type: 'Point',
        coordinates: [coords.lng, coords.lat],
      };
    }

    return this.requestRepository.save(request);
  }

  async findAll(category?: string): Promise<VolunteerRequest[]> {
    const base = {
      relations: [...REQUEST_RELATIONS],
      order: { createdAt: 'DESC' as const },
    };
    if (category) {
      return this.requestRepository.find({ where: { category }, ...base });
    }
    return this.requestRepository.find(base);
  }

  async findOneById(id: string): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: [...REQUEST_RELATIONS],
    });
    if (!request) throw new NotFoundException(`Запит з id=${id} не знайдено`);
    return request;
  }

  async findInProgressForVolunteer(volunteerUserId: string): Promise<VolunteerRequest[]> {
    return this.requestRepository.find({
      where: { volunteerId: volunteerUserId, status: RequestStatus.IN_PROGRESS },
      relations: ['organization', 'organization.user'],
      order: { createdAt: 'DESC' },
    });
  }

  private async ensureVolunteerProfile(userId: string): Promise<VolunteerProfile> {
    let profile = await this.volunteerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      profile = this.volunteerProfileRepository.create({
        userId,
        averageRating: 0,
        completedRequestsCount: 0,
      });
      profile = await this.volunteerProfileRepository.save(profile);
    }
    return profile;
  }

  async acceptRequest(requestId: string, volunteerId: string): Promise<VolunteerRequest> {
    const request = await this.findOneById(requestId);

    if (request.status !== RequestStatus.OPEN) {
      throw new ForbiddenException('Цей запит вже не доступний');
    }

    await this.ensureVolunteerProfile(volunteerId);

    request.volunteerId = volunteerId;
    request.status = RequestStatus.IN_PROGRESS;
    await this.requestRepository.save(request);
    return this.findOneById(requestId);
  }

  async updateStatus(id: string, status: string, currentUser: JwtUser): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['organization', 'organization.user'],
    });

    if (!request) {
      throw new NotFoundException('Запит не знайдено');
    }

    if (status === RequestStatus.COMPLETED) {
      throw new BadRequestException(
        'Щоб завершити запит, використайте completeRequestWithReview з відгуком',
      );
    }

    const userEntity = new User();
    userEntity.id = currentUser.id;
    userEntity.role = currentUser.role as UserRole;

    const ability = this.caslAbilityFactory.createForUser(userEntity);

    if (ability.cannot(Action.Update, request)) {
      throw new ForbiddenException('Ви можете змінювати статус тільки власних запитів');
    }

    request.status = status as RequestStatus;
    return this.requestRepository.save(request);
  }

  async completeRequestWithReview(
    currentUser: JwtUser,
    input: CompleteRequestWithReviewInput,
  ): Promise<VolunteerRequest> {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Рейтинг має бути від 1 до 5');
    }

    return await this.requestRepository.manager.transaction(async (em) => {
      const reqBase = await em.findOne(VolunteerRequest, {
        where: { id: input.requestId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!reqBase) {
        throw new NotFoundException('Запит не знайдено');
      }

      const fullReq = await em.findOne(VolunteerRequest, {
        where: { id: reqBase.id },
        relations: ['organization', 'volunteer', 'review'],
        loadEagerRelations: false,
      });

      if (!fullReq) {
        throw new NotFoundException('Помилка завантаження даних запиту');
      }

      if (fullReq.organization.userId !== currentUser.id) {
        throw new ForbiddenException('Лише власник організації може завершити цей запит');
      }

      if (fullReq.status !== RequestStatus.IN_PROGRESS) {
        throw new BadRequestException('Можна завершити лише запит у статусі "У процесі"');
      }

      if (!fullReq.volunteerId || !fullReq.volunteer) {
        throw new BadRequestException('До запиту не прив’язано волонтера');
      }

      if (fullReq.review) {
        throw new ConflictException('Відгук для цього запиту вже залишено');
      }

      const review = em.create(Review, {
        rating: input.rating,
        comment: input.comment,
        organizationId: fullReq.organizationId,
        volunteerProfileId: fullReq.volunteer.id,
        volunteerRequestId: fullReq.id,
      });

      try {
        await em.save(review);
      } catch (e) {
        if (this.isPostgresUniqueViolation(e)) {
          throw new ConflictException('Відгук для цього запиту вже залишено');
        }
        throw e;
      }

      await em.update(VolunteerRequest, { id: fullReq.id }, { status: RequestStatus.COMPLETED });

      await this.refreshVolunteerStatsAfterReview(em, fullReq.volunteer.id);

      const completed = await em.findOne(VolunteerRequest, {
        where: { id: fullReq.id },
        relations: [...REQUEST_RELATIONS],
      });

      if (!completed) {
        throw new NotFoundException('Запит не знайдено після завершення');
      }

      return completed;
    });
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver = error.driverError;
    if (driver && typeof driver === 'object' && 'code' in driver) {
      return (driver as { code: string }).code === '23505';
    }
    return false;
  }

  private async refreshVolunteerStatsAfterReview(
    em: EntityManager,
    volunteerProfileId: string,
  ): Promise<void> {
    const raw = await em
      .getRepository(Review)
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'avg')
      .addSelect('COUNT(r.id)', 'cnt')
      .where('r.volunteerProfileId = :id', { id: volunteerProfileId })
      .getRawOne<{ avg: string; cnt: string }>();

    const avg = raw?.avg != null ? Math.round(Number(raw.avg) * 100) / 100 : 0;
    const completedCnt = raw?.cnt != null ? parseInt(raw.cnt, 10) : 0;

    await em.getRepository(VolunteerProfile).update(volunteerProfileId, {
      averageRating: avg,
      completedRequestsCount: completedCnt,
    });
  }

  async getMyRequests(userId: string): Promise<VolunteerRequest[]> {
    return this.requestRepository.find({
      where: { organization: { user: { id: userId } } },
      relations: [...REQUEST_RELATIONS],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteRequest(id: string, currentUser: JwtUser): Promise<boolean> {
    const request = await this.requestRepository.findOne({ 
      where: { id },
      relations: ['organization'] 
    });

    if (!request) throw new NotFoundException('Запит не знайдено');

    const userEntity = new User();
    userEntity.id = currentUser.id;
    userEntity.role = currentUser.role as UserRole;

    const ability = this.caslAbilityFactory.createForUser(userEntity);

    if (ability.cannot(Action.Delete, request)) {
      throw new ForbiddenException('Ви не можете видалити чужий запит');
    }

    await this.requestRepository.remove(request);
    return true;
  }

  async getNearbyRequests(lat: number, lng: number, radius: number) {
    return this.requestRepository
      .createQueryBuilder('request')
      .where(
        'ST_DWithin(request.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lat, lng, radius },
      )
      .leftJoinAndSelect('request.organization', 'organization')
      .leftJoinAndSelect('organization.user', 'organizationUser')
      .leftJoinAndSelect('request.volunteer', 'volunteer')
      .leftJoinAndSelect('volunteer.user', 'volunteerUser') 
      .leftJoinAndSelect('request.review', 'review')
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }
}