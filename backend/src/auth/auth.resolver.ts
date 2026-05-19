import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response';
import { RegisterInput } from './dto/register.input'; // Використовуємо DTO з модуля users
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { UseGuards } from '@nestjs/common';
import { AbilityFactory } from 'src/casl/factories/ability.factory';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private caslAbilityFactory: AbilityFactory,
  ) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthResponse) 
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse) // 👈 Використовуємо той самий AuthResponse!
  async loginWith2FA(
    @Args('userId', { type: () => String }) userId: string,
    @Args('code') code: string,
  ) {
    return this.authService.loginWith2FactorAuthentication(userId, code);
  }

  @Query(() => AuthResponse)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any): Promise<AuthResponse> {
    // 1. Отримуємо ПОВНУ сутність з бази (де точно є isEmailVerified)
    const fullUser = await this.usersService.findOneById(user.id);

    // 2. Створюємо правила на основі повної сутності
    const ability = this.caslAbilityFactory.createForUser(fullUser);

    const rules = (ability.rules as any[]).map(rule => ({
      ...rule,
      subject: typeof rule.subject === 'function' ? rule.subject.name : rule.subject,
    }));

    return {
      user: fullUser, // Повертаємо повний об'єкт
      rules,
    };
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args('token') token: string): Promise<boolean> {
    try {
      // Делегуємо перевірку в AuthService
      return await this.authService.verifyEmail(token);
    } catch (error) {
      // Якщо токен застарів або невірний, повернеться false
      console.error('Помилка верифікації:', error.message);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async resendVerificationEmail(@Args('userId') userId: string) {
    try {
      // 1. Оновлюємо токен на НОВИЙ
      const userWithNewToken = await this.authService.generateVerificationToken(userId);
      
      // 2. Відправляємо лист з новим токеном
      await Promise.race([
        this.authService.sendVerificationEmail(userWithNewToken),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      return true;
    } catch (error) {
      return false; 
    }
  }
  
  @Mutation(() => Boolean)
  async changePassword(
    @Args('userId') userId: string,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    // Зверни увагу: ми не використовуємо try/catch з return false, 
    // щоб помилка "Невірний старий пароль" дійшла до фронтенду!
    return this.authService.changePassword(userId, oldPassword, newPassword);
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Args('email') email: string): Promise<boolean> {
    return this.authService.forgotPassword(email);
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('token') token: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    return this.authService.resetPassword(token, newPassword);
  }

  @Mutation(() => String)
  async generate2FA(
    @Args('userId', { type: () => String }) userId: string // 👈 Явно вказуємо тип для GraphQL та TS
  ) {
    const user = await this.usersService.findOneById(userId);
    return this.authService.generateTwoFactorSecret(user);
  }

  @Mutation(() => Boolean)
  async turnOn2FA(
    @Args('userId', { type: () => String }) userId: string, // 👈 Тут також
    @Args('code') code: string
  ) {
    const user = await this.usersService.findOneById(userId);
    
    const isValid = await this.authService.verifyTwoFactorCode(code, user);
    
    if (!isValid) {
      throw new Error('Невірний код 2FA');
    }

    await this.usersService.turnOnTwoFactor(userId);
    return true;
  }
}