import { gql } from 'apollo-angular';

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminGetDashboardStats {
      totalUsers
      pendingOrganizations
      totalRequests
      activityChart {
        date
        count
      }
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
      phone
      isEmailVerified
      createdAt
      region
      city
    }
  }
`;

export const GET_ADMIN_ORGS = gql`
  query GetAdminOrgs {
    adminGetAllOrganizations {
      id
      name
      edrpou
      isVerified
      website
      description
      createdAt
      user {      
        id
        email
      }
    }
  }
`;

export const GET_ADMIN_REQUESTS = gql`
  query GetAdminRequests {
    adminGetAllRequests {
      id
      title
      category
      description
      status
      createdAt
      location {
        address
      }
      organization {
        name
        user {
          email
        }
      }
    }
  }
`;

