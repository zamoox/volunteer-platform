// backend/src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, role: string = 'volunteer'): Promise<User> {
    // Перевірка чи існує юзер
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role
    });

    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }
}