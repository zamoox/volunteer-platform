import { gql } from 'apollo-angular';

export const REQUEST_LOCATION_FIELDS = gql`
  fragment LocationFields on Location {
    lat
    lng
    address
  }
`;

export const REQUEST_CORE_FIELDS = gql`
  fragment RequestCoreFields on VolunteerRequest {
    id
    title
    description
    category
    status
    createdAt
  }
`;

export const REQUEST_ORGANIZATION_FIELDS = gql`
  fragment RequestOrganizationFields on OrganizationProfile {
    id
    name
    description
    userId
  }
`;

export const REQUEST_VOLUNTEER_FIELDS = gql`
  fragment RequestVolunteerFields on User {
    id
    firstName
    lastName
  }
`;