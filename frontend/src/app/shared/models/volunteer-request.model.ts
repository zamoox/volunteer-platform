export interface VolunteerRequest {
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
  };

  organization?: {
    id: string;
    name: string;
    description?: string;
  };

  volunteer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}