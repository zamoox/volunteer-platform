// backend/src/auth/casl/decorators/check-policies.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../types/app-ability.type';

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;
export const CHECK_POLICIES_KEY = 'check_policy';

export const CheckPolicies = (...handlers: PolicyHandlerCallback[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);