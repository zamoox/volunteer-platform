// backend/src/auth/casl/casl.module.ts
import { Module } from '@nestjs/common';
import { AbilityFactory } from './factories/ability.factory';
import { PoliciesGuard } from './guards/policies.guards';

@Module({
  providers: [AbilityFactory, PoliciesGuard],
  exports: [AbilityFactory, PoliciesGuard],
})
export class CaslModule {}