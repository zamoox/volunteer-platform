import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from '../enums/request-status.enum';
import { RequestSubcategory } from '../enums/request-category.enum';

@InputType()
export class LocationInput {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}

@InputType()
export class CreateRequestInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => String, { nullable: true })
  status?: RequestStatus;

  @Field()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @Field(() => RequestSubcategory)
  @IsEnum(RequestSubcategory)
  @IsNotEmpty()
  subcategory!: RequestSubcategory;

  @Field({ nullable: true })
  address?: string;

  @Field(() => LocationInput)
  @ValidateNested()
  @Type(() => LocationInput)
  coords!: LocationInput;
}