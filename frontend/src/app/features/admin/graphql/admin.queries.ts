import { gql } from 'apollo-angular';

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminGetDashboardStats {
      totalUsers
      pendingOrganizations
      totalRequests
    }
  }
`;

export const GET_ADMIN_USERS = gql`
  query GetAdminUsers {
    adminGetAllUsers {
      id
      email
      firstName
      role
      status
      isEmailVerified
      createdAt
    }
  }
`;

