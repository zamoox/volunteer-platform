// backend/src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterInput } from '../auth/dto/register.input';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from 'src/enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';


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
      city,
      isEmailVerified: false // 👈 По замовчуванню не верифікований
    });

    return this.usersRepository.save(user);
  }

  async findOneById(userId: string | number): Promise<User> {
    // Оскільки база очікує UUID, ми просто передаємо рядок без конвертації в число
    const user = await this.usersRepository.findOne({ 
      where: { id: userId as any } 
    });

    if (!user) {
      throw new NotFoundException(`Користувача з ID ${userId} не знайдено`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneWithSecret(id: string | number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: id as any },
      select: [
        'id', 
        'email', 
        'firstName', 
        'role', 
        'city', 
        'region', 
        'isEmailVerified', 
        'isTwoFactorEnabled', 
        'twoFactorSecret'
      ]
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find(); 
  }

  // 1. Знаходимо юзера за токеном
  async findByToken(token: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      // Якщо токена немає в базі, кидаємо помилку
      throw new NotFoundException('Недійсний або прострочений токен підтвердження');
    }
    
    return user;
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    await this.usersRepository.update(id, { status });
    return this.findOneById(id);
  }

  async countByRole(role?: UserRole): Promise<number> {
    if (role) return this.usersRepository.count({ where: { role } });
    return this.usersRepository.count();
  }

  async updateVerificationToken(userId: string | number, token: string, expiresAt: Date): Promise<User> {
    await this.usersRepository.update(userId, {
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    });
    
    return this.findOneById(userId);
  }

  async markAsVerified(userId: string | number): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null, // Токен одноразовий, тому видаляємо його після успіху
    });
  }

  async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
    await this.usersRepository.update(userId, {
      password: newHashedPassword,
    });
  }
  
  async setTwoFactorSecret(secret: string, userId: number | string): Promise<void> {
    await this.usersRepository.update(userId, {
      twoFactorSecret: secret,
    });
  }

  async turnOnTwoFactor(userId: number | string): Promise<void> {
    await this.usersRepository.update(userId, {
      isTwoFactorEnabled: true,
    });
  }
}



