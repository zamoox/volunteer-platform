import { gql } from 'apollo-angular';

export const MY_VOLUNTEER_PROFILE = gql`
  query MyVolunteerProfile {
    myVolunteerProfile {
      id
      userId
      firstName
      lastName
      averageRating
      completedRequestsCount
      user {
        phone
        firstName
        lastName
      }
      activeTasks {
        id
        title
        description
        category
        status
        createdAt
        location {
          lat
          lng
          address
        }
        organization {
          name
          phone
          user {
            phone
          }
        }
      }
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
  }
`;
