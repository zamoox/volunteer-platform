import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class BanUserInput {
  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason: string;
}