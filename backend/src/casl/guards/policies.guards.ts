// backend/src/auth/casl/guards/policies.guards.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CHECK_POLICIES_KEY, PolicyHandlerCallback } from '../decorators/check-policies.decorator';
import { AbilityFactory } from '../factories/ability.factory';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandlerCallback[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    ) || [];

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user; // Користувач має бути доданий JwtGuard

    if (!user) return false;

    const ability = this.caslAbilityFactory.createForUser(user);
    return policyHandlers.every((handler) => handler(ability));
  }
}