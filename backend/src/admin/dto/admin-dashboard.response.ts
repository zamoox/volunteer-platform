import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AdminDashboardResponse {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  pendingOrganizations: number; // К-ть організацій зі статусом isVerified: false

  @Field(() => Int)
  totalRequests: number;

  // Можна додати дані для графіків
}