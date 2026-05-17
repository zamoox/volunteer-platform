
export interface VolunteerLocation {
  lat: number;
  lng: number;
}

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
  location: VolunteerLocation;
  __typename?: 'Volunteer';
}

export interface NearbyVolunteer {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  averageRating: number;
  completedRequestsCount: number;
  lastActiveAt?: string;
  coords?: { lat: number; lng: number };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}
