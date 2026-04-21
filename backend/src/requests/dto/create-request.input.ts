import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
class LocationInput {
  @Field(() => Float)
  lat: number;

  @Field(() => Float)
  lng: number;

  @Field({ nullable: true })
  address?: string;
}

@InputType()
export class CreateVolunteerRequestInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field(() => LocationInput)
  location: LocationInput;
}