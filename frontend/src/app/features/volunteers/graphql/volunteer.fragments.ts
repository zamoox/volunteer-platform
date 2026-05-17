import { gql } from 'apollo-angular';

export const VOLUNTEER_PROFILE_FIELDS = gql`
  fragment VolunteerProfileFields on VolunteerProfile {
    id
    userId
    firstName
    lastName
    averageRating
    completedRequestsCount
    coords {
      lat
      lng
    }
  }
`;

export const ACTIVE_TASKS_FIELDS = gql`
  fragment ActiveTasksFields on VolunteerProfile {
    activeTasks {
      id
      title
      description
      category
      status
      createdAt
      address
      coords {
        lat
        lng
      }
      organization {
        name
        phone
        user {
          phone
        }
      }
    }
  }
`;

export const REVIEWS_FIELDS = gql`
  fragment ReviewsFields on VolunteerProfile {
    reviews {
      id
      rating
      comment
      createdAt
      organization {
        name
      }
    }
  }
`;

export const USER_FIELDS = gql`
  fragment UserFields on VolunteerProfile {
    user {
      id
      phone
      firstName
      lastName
    }
  }
`;