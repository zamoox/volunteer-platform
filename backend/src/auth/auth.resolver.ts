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
    await this.usersService.create(input);
    return this.authService.login(input.email, input.password);
  }
}