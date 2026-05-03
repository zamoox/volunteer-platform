import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response';
import { CreateUserInput } from '../users/dto/create-user.input'; // Використовуємо DTO з модуля users
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

  @Mutation(() => User)
  async register(@Args('input') input: CreateUserInput) {
    return this.usersService.create(
      input.email,
      input.password,
      'volunteer'
    );
  }
}