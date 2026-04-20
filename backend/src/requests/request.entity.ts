// backend/src/requests/request.entity.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Location {
  @Field(() => Float)
  lat!: number; // Додано !

  @Field(() => Float)
  lng!: number; // Додано !

  @Field({ nullable: true })
  address?: string;
}

@ObjectType()
export class VolunteerRequest {
  @Field(() => ID)
  id!: string; // Додано !

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field()
  category!: string;

  @Field()
  status!: string;

  @Field(() => Location)
  location!: Location;

  @Field()
  createdAt!: Date;
}