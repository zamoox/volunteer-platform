import type { Volunteer } from '@features/volunteers/models/volunteer.model';

export interface RequestReview {
  id: string;
  __typename?: 'Review';
}

export interface VolunteerRequest {
  __typename?: 'VolunteerRequest';
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  address: string;

  coords: {
    lat: number;
    lng: number;
    __typename?: 'Location';
  };

  organization?: {
    id: string;
    name: string;
    phone?: string | null;
    description?: string;
    userId: string;
    user?: {
      id: string;
      phone?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    __typename?: 'OrganizationProfile';
  };

  volunteer?: Volunteer | null;
  review?: RequestReview | null;
}
