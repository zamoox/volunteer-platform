import { InputType, Field, Float } from '@nestjs/graphql';


@InputType()
export class UpdateVolunteerLocationInput {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}

@InputType()
export class UpdateVolunteerProfileInput {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  region?: string;
}