import { Injectable } from '@nestjs/common';
import { VolunteerRequest } from './request.entity';
import { CreateVolunteerRequestInput } from './dto/create-request.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RequestsService {

  constructor(
    @InjectRepository(VolunteerRequest)
    private requestsRepository: Repository<VolunteerRequest>,
  ){}
  private requests: VolunteerRequest[] = [
    {
      id: '1',
      title: 'Допомога з ліками (Оболонь)',
      description: 'Потрібно купити та завезти інсулін для пенсіонера.',
      category: 'medical',
      status: 'open',
      createdAt: new Date(),
      // Додаємо локацію, бо в Entity вона тепер обов'язкова
      location: {
        lat: 50.5067, 
        lng: 30.4966,
        address: 'вул. Маршала Тимошенка, 12'
      }
    },
    {
      id: '2',
      title: 'Перевезення гуманітарки',
      description: 'Потрібен водій з бусом для доставки продуктів.',
      category: 'transport',
      status: 'open',
      createdAt: new Date(),
      location: {
        lat: 50.4501,
        lng: 30.5234,
        address: 'Майдан Незалежності'
      }
    }
  ];

  async findAll(): Promise<VolunteerRequest[]> {
    return await this.requestsRepository.find();
  }

  async create(input: CreateVolunteerRequestInput): Promise<VolunteerRequest> {
    const newRequest = this.requestsRepository.create(input);
    return this.requestsRepository.save(newRequest);
  }
}