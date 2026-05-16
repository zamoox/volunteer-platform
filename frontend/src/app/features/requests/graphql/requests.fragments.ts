import { gql } from 'apollo-angular';

export const REQUEST_LOCATION_FIELDS = gql`
  fragment LocationFields on Location {
    lat
    lng
  }
`;

export const REQUEST_CORE_FIELDS = gql`
  fragment RequestCoreFields on VolunteerRequest {
    id
    title
    description
    category
    status
    address
    createdAt
  }
`;

export const REQUEST_ORGANIZATION_USER_FIELDS = gql`
  fragment RequestOrganizationUserFields on User {
    id
    phone
    firstName
    lastName
  }
`;

export const REQUEST_ORGANIZATION_FIELDS = gql`
  fragment RequestOrganizationFields on OrganizationProfile {
    id
    name
    description
    userId
    user {
      ...RequestOrganizationUserFields
    }
  }
  ${REQUEST_ORGANIZATION_USER_FIELDS}
`;

export const REQUEST_VOLUNTEER_USER_FIELDS = gql`
  fragment RequestVolunteerUserFields on User {
    id
    phone
    firstName
    lastName
  }
`;

export const REQUEST_VOLUNTEER_FIELDS = gql`
  fragment RequestVolunteerFields on Volunteer {
    id
    userId
    firstName
    lastName
    averageRating
    completedRequestsCount
    user {
      ...RequestVolunteerUserFields
    }
  }
  ${REQUEST_VOLUNTEER_USER_FIELDS}
`;

export const REQUEST_REVIEW_FIELDS = gql`
  fragment RequestReviewFields on Review {
    id
  }
`;