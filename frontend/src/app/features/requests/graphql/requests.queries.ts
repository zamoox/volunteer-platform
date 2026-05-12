import { gql } from 'apollo-angular';
import {
  REQUEST_CORE_FIELDS,
  REQUEST_LOCATION_FIELDS,
  REQUEST_ORGANIZATION_FIELDS,
  REQUEST_VOLUNTEER_FIELDS,
  REQUEST_REVIEW_FIELDS,
} from './requests.fragments';

export const GET_ALL_REQUESTS = gql`
  query ExampleQuery($category: String) {
    getAllRequests(category: $category) {
      ...RequestCoreFields
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
      location {
        ...LocationFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
`;

export const GET_MY_REQUESTS = gql`
  query GetMyRequests {
    getMyRequests {
      ...RequestCoreFields
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
      location {
        ...LocationFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
`;