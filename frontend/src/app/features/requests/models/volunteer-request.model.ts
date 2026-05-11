export interface VolunteerRequest {
  __typename?: 'VolunteerRequest';
  
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;

  location: {
    lat: number;
    lng: number;
    address: string;
    __typename?: 'Location';
  };

  organization?: {
    id: string;
    name: string;
    description?: string;
    userId: string;
    __typename?: 'OrganizationProfile';
  };

  volunteer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    __typename?: 'User';
  };
}

