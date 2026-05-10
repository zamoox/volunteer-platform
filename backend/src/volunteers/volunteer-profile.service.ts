// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
//   ConflictException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Organization } from './volunteer-profile.entity';
// import { CreateOrganizationInput } from './dto/create-organization.input';
// import { UpdateOrganizationInput } from './dto/update-organization.input';
// import { UserRole } from '../enums/user-role.enum';

// @Injectable()
// export class OrganizationsService {
//   constructor(
//     @InjectRepository(Organization)
//     private readonly orgRepository: Repository<Organization>,
//   ) {}

//   async create(
//     userId: string,
//     role: UserRole,
//     input: CreateOrganizationInput,
//   ): Promise<Organization> {
//     if (role !== UserRole.ORGANIZATION) {
//       throw new ForbiddenException('Лише організації можуть створювати профіль');
//     }

//     const existing = await this.orgRepository.findOne({ where: { userId } });
//     if (existing) {
//       throw new ConflictException('Профіль організації вже існує');
//     }

//     const org = this.orgRepository.create({ ...input, userId });
//     return this.orgRepository.save(org);
//   }

//   async findAll(): Promise<Organization[]> {
//     return this.orgRepository.find();
//   }

//   async findOneById(id: string): Promise<Organization> {
//     const org = await this.orgRepository.findOne({
//       where: { id },
//       relations: ['requests'],
//     });
//     if (!org) throw new NotFoundException(`Організацію з id=${id} не знайдено`);
//     return org;
//   }

//   async findByUserId(userId: string): Promise<Organization | null> {
//     return this.orgRepository.findOne({
//       where: { userId },
//       relations: ['requests'],
//     });
//   }

//   async update(userId: string, input: UpdateOrganizationInput): Promise<Organization> {
//     const org = await this.orgRepository.findOne({ where: { userId } });
//     if (!org) throw new NotFoundException('Профіль організації не знайдено');
//     Object.assign(org, input);
//     return this.orgRepository.save(org);
//   }

//   async verify(id: string): Promise<Organization> {
//     const org = await this.findOneById(id);
//     org.isVerified = true;
//     return this.orgRepository.save(org);
//   }
// }