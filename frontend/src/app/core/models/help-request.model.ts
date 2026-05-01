export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'medicine' | 'transport' | 'shelter' | 'other';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  userName: string;
  userType: 'individual' | 'organization';
  status: 'active' | 'completed';
}