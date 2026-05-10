import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from '../request.entity';

@InputType()
export class LocationInput {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field({ nullable: true })
  address?: string;
}

@InputType()
export class CreateVolunteerRequestInput {
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

  @Field(() => LocationInput)
  @ValidateNested()
  @Type(() => LocationInput)
  location!: LocationInput;
}