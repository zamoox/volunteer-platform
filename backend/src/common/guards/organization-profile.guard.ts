// src/common/guards/organization-profile.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OrganizationProfileService } from '../../organizations/organization-profile.service';

@Injectable()
export class OrganizationProfileGuard implements CanActivate {
  constructor(private readonly orgProfileService: OrganizationProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const user = req.user; // JwtStrategy кладе юзера сюди

    if (!user) throw new ForbiddenException('Не авторизовано');

    // Якщо не організація — цей guard не стосується
    if (user.role !== 'organization') return true;

    const hasProfile = await this.orgProfileService.hasProfile(user.userId);
    if (!hasProfile) {
      throw new ForbiddenException(
        'Заповніть профіль організації перед створенням запитів (/organization/setup)',
      );
    }

    return true;
  }
}