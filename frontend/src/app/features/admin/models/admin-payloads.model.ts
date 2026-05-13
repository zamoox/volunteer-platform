export interface BanUserPayload {
  userId: string;
  reason: string;
}

// Якщо захочеш додати редагування профілю адміном
// export interface UpdateUserPayload {
//   userId: string;
//   firstName?: string;
//   lastName?: string;
//   role?: UserRole;
//   status?: UserStatus;
// }