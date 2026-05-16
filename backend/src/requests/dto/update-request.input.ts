import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateRequestInput, LocationInput } from './create-request.input';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class UpdateRequestInput extends PartialType(CreateRequestInput) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
  
  @Field(() => LocationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationInput)
  override coords?: LocationInput;
}