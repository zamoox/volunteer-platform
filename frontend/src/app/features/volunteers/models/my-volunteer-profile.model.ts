import type { VolunteerRequest } from '@features/requests/models/volunteer-request.model';

export interface VolunteerReviewListItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  organization?: {
    name?: string | null;
  } | null;
}

export interface MyVolunteerProfile {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  averageRating: number;
  completedRequestsCount: number;
  user?: {
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  reviews?: VolunteerReviewListItem[] | null;
  activeTasks?: VolunteerRequest[] | null;
}
