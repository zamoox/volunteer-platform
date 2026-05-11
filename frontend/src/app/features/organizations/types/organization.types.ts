export interface Organization {
  id: string;
  name: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
  isVerified: boolean;
  userId: string;
  createdAt?: string;
  requests?: any[];
}

export interface CreateOrganizationInput {
  name: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
}