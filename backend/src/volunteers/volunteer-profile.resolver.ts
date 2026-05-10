// import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
// import { UseGuards } from '@nestjs/common';
// import { Organization } from './volunteer-profile.entity';
// import { OrganizationsService } from './volunteer-profile.service';
// import { CreateOrganizationInput } from './dto/create-organization.input';
// import { UpdateOrganizationInput } from './dto/update-organization.input';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { Roles } from '../common/decorators/roles.decorator';
// import { CurrentUser } from '../common/decorators/current-user.decorator';
// import { UserRole } from '../enums/user-role.enum';
// import { JwtUser } from '../common/interfaces/jwt-user.interface';

// @Resolver(() => Organization)
// export class OrganizationsResolver {
//   constructor(private readonly orgsService: OrganizationsService) {}

//   @Query(() => [Organization])
//   async getAllOrganizations(): Promise<Organization[]> {
//     return this.orgsService.findAll();
//   }

//   @Query(() => Organization, { nullable: true })
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.ORGANIZATION)
//   async myOrganization(
//     @CurrentUser() user: JwtUser,
//   ): Promise<Organization | null> {
//     return this.orgsService.findByUserId(user.userId);
//   }

//   @Query(() => Organization)
//   async organization(@Args('id') id: string): Promise<Organization> {
//     return this.orgsService.findOneById(id);
//   }

//   @Mutation(() => Organization)
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.ORGANIZATION)
//   async createOrganizationProfile(
//     @CurrentUser() user: JwtUser,
//     @Args('input') input: CreateOrganizationInput,
//   ): Promise<Organization> {
//     return this.orgsService.create(user.userId, user.role as UserRole, input);
//   }

//   @Mutation(() => Organization)
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.ORGANIZATION)
//   async updateOrganizationProfile(
//     @CurrentUser() user: JwtUser,
//     @Args('input') input: UpdateOrganizationInput,
//   ): Promise<Organization> {
//     return this.orgsService.update(user.userId, input);
//   }

//   @Mutation(() => Organization)
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserRole.ADMIN)
//   async verifyOrganization(@Args('id') id: string): Promise<Organization> {
//     return this.orgsService.verify(id);
//   }
// }