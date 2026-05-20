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
      status
      website
      description
      createdAt
      documents
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
      address
      coords {
        lat
        lng
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

