import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RegisterInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  role!: string; // Приймаємо 'volunteer' або 'organization' з фронтенду

  @Field()
  region!: string;

  @Field()
  city!: string;

}