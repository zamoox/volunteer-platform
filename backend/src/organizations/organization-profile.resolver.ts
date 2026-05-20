// src/organizations/organization-profile.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationProfile } from './organization-profile.entity';
import { OrganizationProfileService } from './organization-profile.service';
import { CreateOrganizationInput } from './dto/create-organization-profile.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { UploadDocumentsInput } from './dto/upload-documents.input';

@Resolver(() => OrganizationProfile)
export class OrganizationProfileResolver {
  constructor(private readonly service: OrganizationProfileService) {}

  @Mutation(() => OrganizationProfile)
  @UseGuards(JwtAuthGuard)
  async createOrganizationProfile(
    @CurrentUser() user: JwtUser,
    @Args('input') input: CreateOrganizationInput,
  ): Promise<OrganizationProfile> {
    return this.service.create(user.id, input);
  }

  @Query(() => OrganizationProfile, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async myOrganizationProfile(
    @CurrentUser() user: JwtUser,
  ): Promise<OrganizationProfile | null> {
    return this.service.findByUserId(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async uploadOrganizationDocs(
    @Args('input') input: UploadDocumentsInput,
    @CurrentUser() user: JwtUser
  ) {
    const hasProfile = await this.service.hasProfile(user.id);

    if (!hasProfile) {
      throw new Error('Спочатку створіть профіль організації');
    }
    
    const regFile = await input.registration;
    const statFile = await input.statute;
    
    return await this.service.handleFileUploads(user.id, regFile, statFile);
  }
}