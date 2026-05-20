import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ChartDataPoint {
  @Field()
  date: string; // Формат "DD.MM"

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class AdminDashboardResponse {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  pendingOrganizations: number; 

  @Field(() => Int)
  totalRequests: number;

  @Field(() => [ChartDataPoint]) // Нове поле для графіка
  activityChart: ChartDataPoint[];

}