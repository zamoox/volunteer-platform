import { gql } from 'apollo-angular';
import {
  REQUEST_CORE_FIELDS,
  REQUEST_LOCATION_FIELDS,
  REQUEST_ORGANIZATION_FIELDS,
  REQUEST_VOLUNTEER_FIELDS,
  REQUEST_REVIEW_FIELDS,
} from './requests.fragments';

export const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateVolunteerRequestInput!) {
    createRequest(input: $input) {
      ...RequestCoreFields
      location {
        ...LocationFields
      }
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
`;

export const UPDATE_REQUEST = gql`
  mutation UpdateRequest($input: UpdateVolunteerRequestInput!) {
    updateRequest(input: $input) {
      ...RequestCoreFields
      location {
        ...LocationFields
      }
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
`;

export const UPDATE_REQUEST_STATUS = gql`
  mutation UpdateRequestStatus($id: String!, $status: String!) {
    updateRequestStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const DELETE_REQUEST = gql`
  mutation DeleteRequest($id: String!) {
    deleteRequest(id: $id)
  }
`;

export const ACCEPT_REQUEST = gql`
  mutation AcceptRequest($requestId: String!) {
    acceptRequest(requestId: $requestId) {
      ...RequestCoreFields
      location {
        ...LocationFields
      }
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
`;

export const COMPLETE_REQUEST_WITH_REVIEW = gql`
  mutation CompleteRequestWithReview($input: CompleteRequestWithReviewInput!) {
    completeRequestWithReview(input: $input) {
      ...RequestCoreFields
      location {
        ...LocationFields
      }
      organization {
        ...RequestOrganizationFields
      }
      volunteer {
        ...RequestVolunteerFields
      }
      review {
        ...RequestReviewFields
      }
    }
  }
  ${REQUEST_CORE_FIELDS}
  ${REQUEST_LOCATION_FIELDS}
  ${REQUEST_ORGANIZATION_FIELDS}
  ${REQUEST_VOLUNTEER_FIELDS}
  ${REQUEST_REVIEW_FIELDS}
`;