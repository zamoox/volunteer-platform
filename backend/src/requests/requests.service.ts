import { Injectable } from '@nestjs/common';
import { VolunteerRequest } from './request.entity';

@Injectable()
export class RequestsService {
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

  findAll(): VolunteerRequest[] {
    return this.requests;
  }
}