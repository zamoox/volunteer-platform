import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateVolunteerRequestInput } from './create-request.input';

@InputType()
export class UpdateVolunteerRequestInput extends PartialType(CreateVolunteerRequestInput) {
  @Field(() => ID)
  id: string;
}