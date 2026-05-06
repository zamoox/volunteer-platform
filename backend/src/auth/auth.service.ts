import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RegisterInput } from './dto/register.input';
import { TOTP } from '@otplib/totp';
import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  
  private totp = new TOTP();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService
  ) {
    this.totp = new TOTP({
      crypto: new NodeCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
  }

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
      const userWithToken = await this.generateVerificationToken(user.id);
      await this.sendVerificationEmail(userWithToken);
      console.log(`Лист верифікації відправлено на: ${user.email}`);
    } catch (error) {
      console.error('Помилка відправки пошти:', error);
      // Можна або кидати помилку, або просто логувати, щоб не переривати реєстрацію
    }

    // 3. Автоматично логінимо після реєстрації
    return this.login(input.email, input.password);
  }

  async generateVerificationToken(userId: string | number): Promise<User> {
    // Створюємо безпечний випадковий рядок
    const token = randomBytes(32).toString('hex');
    
    // Ставимо час життя токена (наприклад, 24 години)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Викликаємо UsersService ТІЛЬКИ для збереження в базу
    return this.usersService.updateVerificationToken(userId, token, expiresAt);
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

  async verifyEmail(token: string): Promise<boolean> {
    // 1. Шукаємо юзера
    const user = await this.usersService.findByToken(token);
    
    if (!user) {
      throw new BadRequestException('Недійсний токен верифікації');
    }

    // 2. Перевіряємо час життя токена
    const currentTime = new Date();
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < currentTime) {
      throw new BadRequestException('Час дії токена сплив. Будь ласка, запросіть новий лист.');
    }

    // 3. Якщо все ок — оновлюємо статус у базі
    await this.usersService.markAsVerified(user.id);

    return true;
  }

  async generateTwoFactorAuthenticationSecret(user: User) {
    // Генеруємо секрет
    const secret = this.totp.generateSecret();

    // Створюємо URI для Google Authenticator
    const otpauthUrl = this.totp.toURI({
      label: user.email,
      secret: secret,
    });

    // Зберігаємо секрет у БД
    await this.usersService.setTwoFactorAuthenticationSecret(secret, user.id);

    // Повертаємо QR-код у форматі Base64 для фронтенду
    return QRCode.toDataURL(otpauthUrl);
  }

  // 2. Перевірка введеного коду (Асинхронна у новій версії!)
  async verifyTwoFactorAuthenticationCode(code: string, user: User): Promise<boolean> {
    const result = await this.totp.verify(code, {
      secret: user.twoFactorAuthenticationSecret,
    });
    return result.valid;
  }

}