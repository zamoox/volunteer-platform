import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response';
import { RegisterInput } from './dto/register.input'; // Використовуємо DTO з модуля users
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Mutation(() => LoginResponse) 
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args('token') token: string): Promise<boolean> {
    try {
      const user = await this.usersService.findByToken(token); // Знаходимо юзера
      await this.usersService.markAsVerified(user.id); // Оновлюємо статус
      return true;
    } catch (error) {
      return false;
    }
  }

  @Mutation(() => String)
  async generate2FA(
    @Args('userId', { type: () => String }) userId: string // 👈 Явно вказуємо тип для GraphQL та TS
  ) {
    const user = await this.usersService.findOneById(userId);
    return this.authService.generateTwoFactorAuthenticationSecret(user);
  }

  @Mutation(() => Boolean)
  async turnOn2FA(
    @Args('userId', { type: () => String }) userId: string, // 👈 Тут також
    @Args('code') code: string
  ) {
    const user = await this.usersService.findOneById(userId);
    
    const isValid = await this.authService.verifyTwoFactorAuthenticationCode(code, user);
    
    if (!isValid) {
      throw new Error('Невірний код 2FA');
    }

    await this.usersService.turnOnTwoFactorAuthentication(userId);
    return true;
  }
}