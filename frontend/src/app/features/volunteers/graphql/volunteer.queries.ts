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
        id
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

export const GET_NEARBY_VOLUNTEERS = gql`
  query GetNearbyVolunteers($lat: Float!, $lng: Float!, $radius: Float) {
    getNearbyVolunteers(lat: $lat, lng: $lng, radius: $radius) {
      id
      userId
      firstName
      lastName
      averageRating
      completedRequestsCount
      lastActiveAt
      coords {
        lat
        lng
      }
      user {
        id
        firstName
        lastName
      }
    }
  }
`;