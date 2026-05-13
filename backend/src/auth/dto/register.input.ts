import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  password!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  // Для сумісності зі старим кодом (auth.service використовує name)
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { defaultValue: UserRole.VOLUNTEER })
  @IsEnum(UserRole)
  role: UserRole = UserRole.VOLUNTEER;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

}