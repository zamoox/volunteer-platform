/** Відповідає GraphQL типу Volunteer (профіль волонтера) */
export interface VolunteerUser {
  id: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  __typename?: 'User';
}

export interface Volunteer {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  region?: string | null;
  city?: string | null;
  averageRating: number;
  completedRequestsCount: number;
  user?: VolunteerUser | null;
  __typename?: 'Volunteer';
}
