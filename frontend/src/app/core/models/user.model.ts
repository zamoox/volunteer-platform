export interface User {
  id: string;
  email: string;
  role: 'volunteer' | 'organization' | 'admin';
  firstName?: string; // Додамо ці поля в сутність пізніше
  lastName?: string;
  city?: string;
  isEmailVerified: boolean
}