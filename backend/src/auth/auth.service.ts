import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RegisterInput } from './dto/register.input';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    }
    throw new UnauthorizedException('Невірний email або пароль');
  }

  async register(input: RegisterInput) {
    // 1. Створюємо користувача в БД
    const user = await this.usersService.create(input);

    // 2. Відправляємо лист (через await, щоб переконатися, що SMTP не впаде)
    try {
      await this.sendVerificationEmail(user);
      console.log(`Лист верифікації відправлено на: ${user.email}`);
    } catch (error) {
      console.error('Помилка відправки пошти:', error);
      // Можна або кидати помилку, або просто логувати, щоб не переривати реєстрацію
    }

    // 3. Автоматично логінимо після реєстрації
    return this.login(input.email, input.password);
  }

  async sendVerificationEmail(user: User) {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const verificationLink = `${baseUrl}/verify?token=${user.verificationToken}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Підтвердження реєстрації — Volunteer Platform',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #10b981;">Вітаємо, ${user.firstName}! 🎉</h2>
          <p>Дякуємо за реєстрацію на нашій платформі. Щоб почати допомагати, підтвердіть, будь ласка, свій Email:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Підтвердити пошту
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
            Якщо ви не створювали цей акаунт, просто ігноруйте цей лист.
          </p>
        </div>
      `,
    });
  }
}