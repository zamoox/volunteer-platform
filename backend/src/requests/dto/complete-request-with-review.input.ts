import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

@InputType()
export class CompleteRequestWithReviewInput {
  @Field()
  @IsUUID()
  requestId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  comment?: string;
}
