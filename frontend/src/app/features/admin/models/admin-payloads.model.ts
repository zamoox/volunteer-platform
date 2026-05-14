export interface BanUserPayload {
  userId: string;
  reason: string;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  pendingOrganizations: number;
  totalRequests: number;
  activityChart: ChartDataPoint[]; // Нове поле з бекенду
}

// Якщо захочеш додати редагування профілю адміном
// export interface UpdateUserPayload {
//   userId: string;
//   firstName?: string;
//   lastName?: string;
//   role?: UserRole;
//   status?: UserStatus;
// }