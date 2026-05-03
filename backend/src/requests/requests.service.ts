import { Injectable, NotFoundException } from '@nestjs/common';
import { VolunteerRequest } from './request.entity';
import { CreateVolunteerRequestInput } from './dto/create-request.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RequestsService {

  constructor(
    @InjectRepository(VolunteerRequest)
    private requestRepository: Repository<VolunteerRequest>,
  ){}

  async findAll(category?: string): Promise<VolunteerRequest[]> {
  if (category) {
    // Якщо категорія є — фільтруємо в БД
    return this.requestRepository.find({ where: { category } });
  }
    // Якщо немає — повертаємо все
    return this.requestRepository.find();
  }

  async create(input: CreateVolunteerRequestInput): Promise<VolunteerRequest> {
    const newRequest = this.requestRepository.create(input);
    return this.requestRepository.save(newRequest);
  }

  async updateStatus(id: string, status: string): Promise<VolunteerRequest> {
    const request = await this.requestRepository.findOneBy({ id });
    
    if (!request) {
      throw new NotFoundException(`Запит з ID ${id} не знайдено`);
    }

    request.status = status;
    return this.requestRepository.save(request);
  }
}