import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/user.entity';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class PermissionRule {
  @Field()
  action: string;

  @Field(() => String)
  subject: string;

  @Field(() => GraphQLJSON, { nullable: true })
  conditions?: any;

  @Field({ nullable: true })
  inverted?: boolean;

  @Field({ nullable: true })
  reason?: string;
}

@ObjectType()
export class AuthResponse { 
  @Field({ nullable: true }) 
  access_token?: string;

  @Field(() => User, { nullable: true }) 
  user?: User;

  @Field(() => [PermissionRule], { nullable: true })
  rules?: PermissionRule[];

  @Field({ nullable: true })
  require2FA?: boolean;

  @Field(() => ID, { nullable: true })
  userId?: string | number;

  @Field({ nullable: true })
  message?: string;
}