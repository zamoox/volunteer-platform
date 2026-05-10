// src/organizations/organization-profile.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationProfile } from './organization-profile.entity';
import { OrganizationProfileService } from './organization-profile.service';
import { CreateOrganizationInput } from './dto/create-organization-profile.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Resolver(() => OrganizationProfile)
export class OrganizationProfileResolver {
  constructor(private readonly service: OrganizationProfileService) {}

  @Mutation(() => OrganizationProfile)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async createOrganizationProfile(
    @CurrentUser() user: JwtUser,
    @Args('input') input: CreateOrganizationInput,
  ): Promise<OrganizationProfile> {
    return this.service.create(user.userId, input);
  }

  @Query(() => OrganizationProfile, { nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZATION)
  async myOrganizationProfile(
    @CurrentUser() user: JwtUser,
  ): Promise<OrganizationProfile | null> {
    return this.service.findByUserId(user.userId);
  }
}