import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/user.entity';

@ObjectType()
export class LoginResponse {
  @Field({ nullable: true }) 
  access_token?: string;

  @Field(() => User, { nullable: true }) 
  user?: User;

  @Field({ nullable: true })
  require2FA?: boolean;

  @Field(() => ID, { nullable: true })
  userId?: string | number;

  @Field({ nullable: true })
  message?: string;
}