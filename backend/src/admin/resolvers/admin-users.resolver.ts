import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guards';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enum';
import { BanUserInput } from '../dto/ban-user.input';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';
import { AdminUsersService } from '../services/admin-users.service';

@Resolver(() => User)
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AdminUsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminUsersService: AdminUsersService
) {}

  @Query(() => [User], { name: 'adminGetAllUsers' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async findAll() {
    return this.usersService.findAll();
  }

  // Приклад мутації для зміни статусу верифікації адміном
  @Mutation(() => User, { name: 'adminToggleUserVerification' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async toggleVerification(@Args('userId') userId: string) {
    const user = await this.usersService.findOneById(userId);
    // Тут можна додати метод в UsersService для перемикання
    await this.usersService.markAsVerified(userId); // Або спеціальний метод для деактивації
    return this.usersService.findOneById(userId);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteUser' })
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async deleteUser(@Args('userId') userId: string) {
    // Потрібно буде додати метод видалення в UsersService
    // await this.usersService.remove(userId);
    return true;
  }

  @Mutation(() => Boolean)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async banUser(@Args('input') input: BanUserInput, @CurrentUser() admin: JwtUser) {
    return this.adminUsersService.ban(input, admin.id);
  }


}