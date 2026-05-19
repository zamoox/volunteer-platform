import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { UserRole } from 'src/enums/user-role.enum';
import { AuthResponse } from './dto/auth-response';
import { AbilityFactory } from 'src/casl/factories/ability.factory';


@Injectable()
export class AuthService {
  
  private totp = new TOTP();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private caslAbilityFactory: AbilityFactory
  ) {
    this.totp = new TOTP({
      crypto: new NodeCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
  }

  async login(email: string, pass: string): Promise<AuthResponse> {
    console.log('--- LOGIN ATTEMPT ---');
    console.log('1. Email:', email);

    const user = await this.usersService.findOneByEmail(email);
    console.log('2. User found:', !!user);
    
    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    console.log('3. Password match:', isPasswordMatching);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    console.log('4. 2FA Status:', user.isTwoFactorEnabled);

    if (user.isTwoFactorEnabled) {
      console.log('5. Returning 2FA response');
      return {
        require2FA: true,
        userId: user.id,
        message: 'Необхідно ввести код другого фактора'
      };
    }

    // --- НОВА ЧАСТИНА: ГЕНЕРАЦІЯ ПРАВ (RULES) ---
    console.log('5. Generating CASL abilities');
    const ability = this.caslAbilityFactory.createForUser(user);

    const rules = (ability.rules as any[]).map(rule => ({
      ...rule,
      // Якщо subject — це функція (клас), беремо її ім'я, інакше залишаємо як є
      subject: typeof rule.subject === 'function' 
        ? rule.subject.name 
        : rule.subject
    }));
    
    console.log('6. Returning normal token with rules');
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user,
      userId: user.id,
      rules, // Експортуємо правила для фронтенду
      message: 'Успішний вхід'
    };
  }

async loginWith2FactorAuthentication(userId: string, code: string): Promise<AuthResponse> {
  const user = await this.usersService.findOneWithSecret(userId);
  const secret = user?.twoFactorSecret;

  if (!user || !secret) {
    throw new UnauthorizedException('Секрет не знайдено');
  }

  const result = await this.totp.verify(code, { secret });

  if (!result || !result.valid) {
    throw new UnauthorizedException('Невірний код 2FA');
  }

  // ОБОВ'ЯЗКОВО генеруємо права тут теж:
  const ability = this.caslAbilityFactory.createForUser(user);
  const rules = (ability.rules as any[]).map(rule => ({
    ...rule,
    subject: typeof rule.subject === 'function' ? rule.subject.name : rule.subject,
  }));

  const payload = { email: user.email, sub: user.id, role: user.role };
  
  return {
    access_token: this.jwtService.sign(payload),
    user,
    rules, // Додаємо правила
    userId: user.id
  };
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
      template: './verify-email', // 👈 Підключаємо файл .hbs
      context: {                  // 👈 Передаємо змінні
        firstName: user.firstName,
        url: verificationLink,
      },
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

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    // 1. Шукаємо користувача
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    // 2. Перевіряємо, чи правильний старий пароль
    const isPasswordMatching = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatching) {
      throw new BadRequestException('Невірний старий пароль');
    }

    // 3. Хешуємо новий пароль (10 - це saltRounds, стандартне безпечне значення)
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Зберігаємо в базу
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return true;
  }

  async generateTwoFactorSecret(user: User) {
    // 1. Генеруємо секрет
    const secret = this.totp.generateSecret();

    // 2. Створюємо URI (ОБОВ'ЯЗКОВО додаємо issuer)
    const otpauthUrl = this.totp.toURI({
      label: user.email,
      issuer: 'VolunteerPlatform', // 👈 Тепер помилка зникне
      secret: secret,
    });

    // 3. Зберігаємо секрет у БД
    await this.usersService.setTwoFactorSecret(secret, user.id);

    // 4. Повертаємо QR-код (Base64)
    // QRCode.toDataURL — це проміс, тому додаємо await
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (err) {
      throw new Error('Помилка при генерації QR-коду');
    }
  }

  // 2. Перевірка введеного коду
  async verifyTwoFactorCode(code: string, user: User): Promise<boolean> {
    // Якщо секрету немає в базі, верифікація неможлива
    if (!user.twoFactorSecret) {
      return false;
    }

    const result = await this.totp.verify(code, {
      secret: user.twoFactorSecret,
    });

    return result.valid;
  }

async validateGoogleUser(googleUser: any): Promise<AuthResponse> {
  let user = await this.usersService.findOneByEmail(googleUser.email);

  if (!user) {
     user = await this.usersService.create({
      email: googleUser.email,
      firstName: googleUser.firstName, 
      password: Math.random().toString(36).slice(-12),
      role: UserRole.VOLUNTEER,
      region: 'Unknown',
      city: 'Unknown'
    });

    await this.usersService.markAsVerified(user.id);
    user.isEmailVerified = true;
  }

  if (user.isEmailVerified === null || user.isEmailVerified === undefined) {
    user.isEmailVerified = true; 
    await this.usersService.markAsVerified(user.id);
  }

  // --- ГЕНЕРУЄМО ПРАВА (RULES) ТАКОЖ ДЛЯ GOOGLE ЮЗЕРА ---
  const ability = this.caslAbilityFactory.createForUser(user);
  const rules = (ability.rules as any[]).map(rule => ({
    ...rule,
    subject: typeof rule.subject === 'function' 
      ? rule.subject.name 
      : rule.subject
  }));

  const payload = { email: user.email, sub: user.id, role: user.role };

  console.log('user isEmailVerified? ' + user.isEmailVerified);
  
  return {
    access_token: this.jwtService.sign(payload),
    user,
    userId: user.id,
    rules, // Тепер GraphQL не поверне помилку 400
    message: 'Успішний вхід через Google'
  };
}
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user) return true; 

      const resetToken = this.jwtService.sign(
        { sub: user.id, purpose: 'reset-password' },
        { expiresIn: '1h' }
      );

      const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Відновлення доступу — Volunteer Platform',
        template: './reset-password', // 👈 Підключаємо файл .hbs
        context: {                    // 👈 Передаємо змінну url
          url: resetLink,
        },
      });
      return true;
    } catch (error) {
      return true;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Розшифровуємо токен
      const decoded = this.jwtService.verify(token);
      
      // Перевіряємо, чи це дійсно токен для скидання пароля
      if (decoded.purpose !== 'reset-password') {
        throw new BadRequestException('Некоректний токен');
      }

      const userId = decoded.sub;
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await this.usersService.updatePassword(userId, hashedNewPassword);
      return true;
    } catch (error) {
      throw new BadRequestException('Токен недійсний або його час дії вичерпано');
    }
  }

}