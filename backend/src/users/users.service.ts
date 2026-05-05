// backend/src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterInput } from '../auth/dto/register.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(data: RegisterInput): Promise<User> {
    const { email, password, role, name, region, city } = data;

    // Перевірка чи існує юзер
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Створення юзера. Мапимо 'name' у 'firstName' (якщо в БД таке поле)
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role,
      firstName: name, // Або просто name, якщо ти так назвав колонку в Entity
      region,
      city
    });

    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find(); 
  }
}