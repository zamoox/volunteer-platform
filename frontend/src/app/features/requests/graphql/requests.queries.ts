import { gql } from 'apollo-angular';
import {
  REQUEST_CORE_FIELDS,
  REQUEST_LOCATION_FIELDS,
  REQUEST_ORGANIZATION_FIELDS,
  REQUEST_VOLUNTEER_FIELDS,
  REQUEST_REVIEW_FIELDS,
} from './requests.fragments';

export const GET_ALL_REQUESTS = gql`
  query GetAllRequests($category: String) {
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
      coords {
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
      coords {
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

export const GET_NEARBY_REQUESTS = gql`
  query GetNearbyRequests($lat: Float!, $lng: Float!, $radius: Float!) {
    getNearbyRequests(lat: $lat, lng: $lng, radius: $radius) {
      ...RequestCoreFields
      distance_m
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
      coords {
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