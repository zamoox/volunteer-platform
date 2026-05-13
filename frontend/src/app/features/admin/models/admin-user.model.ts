export type UserRole = 'admin' | 'volunteer' | 'organization';
export type UserStatus = 'active' | 'banned' | 'pending';

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string; // GraphQL повертає дату як ISO string
}