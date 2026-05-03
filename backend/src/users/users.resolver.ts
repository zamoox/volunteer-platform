import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  async register(@Args('input') input: CreateUserInput) {
    return this.usersService.create(
      input.email, 
      input.password, 
      'volunteer' // за замовчуванням створюємо волонтера
    );
  }

  @Query(() => [User], { name: 'users' })
  async findAll() {
    // Тимчасово для тестування
    return []; 
  }
}