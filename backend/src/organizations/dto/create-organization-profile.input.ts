import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, Length, IsOptional, IsUrl } from 'class-validator';

@InputType()
export class CreateOrganizationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(8, 10) // ЄДРПОУ зазвичай 8 або 10 символів
  edrpou?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;
}