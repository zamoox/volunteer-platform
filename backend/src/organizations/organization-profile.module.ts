// src/organizations/organization-profile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationProfile } from './organization-profile.entity';
import { OrganizationProfileService } from './organization-profile.service';
import { OrganizationProfileResolver } from './organization-profile.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationProfile])],
  providers: [OrganizationProfileService, OrganizationProfileResolver],
  exports: [OrganizationProfileService], // Потрібен для OrganizationProfileGuard
})
export class OrganizationProfileModule {}