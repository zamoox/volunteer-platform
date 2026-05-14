export interface AdminOrganization {
  id: string;
  name: string;
  edrpou: string;
  description?: string;
  website?: string;
  isVerified: boolean;
  createdAt: string;
  user?: {
    email: string;
  };
}