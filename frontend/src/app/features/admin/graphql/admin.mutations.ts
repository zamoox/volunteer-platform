import { gql } from 'apollo-angular';

export const BAN_USER = gql`
  mutation BanUser($input: BanUserInput!) {
    banUser(input: $input)
  }
`;

export const VERIFY_ORG = gql`
  mutation VerifyOrganization($id: String!) {
    adminVerifyOrganization(id: $id) {
      id
      isVerified
    }
  }
`;

export const DELETE_REQUEST = gql`
  mutation DeleteRequest($id: String!, $reason: String!) {
    adminDeleteRequest(id: $id, reason: $reason)
  }
`;

export const TOGGLE_USER_VERIFICATION = gql`
  mutation ToggleUserVerification($userId: String!) {
    adminToggleUserVerification(userId: $userId) {
      id
      isEmailVerified
    }
  }
`;