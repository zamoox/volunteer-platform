import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsUrl, MaxLength, IsEnum } from 'class-validator';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { CreateOrganizationInput } from './create-organization-profile.input';

@InputType()
export class UpdateOrganizationInput extends PartialType(CreateOrganizationInput) {

  @Field(() => OrganizationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  documents?: string[];
}
