import { gql } from "apollo-angular";
import { ORGANIZATION_FIELDS } from "./organizations.fragments";

export const CREATE_ORGANIZATION_PROFILE = gql`
  mutation CreateOrganizationProfile($input: CreateOrganizationInput!) {
    createOrganizationProfile(input: $input) {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;

export const UPDATE_ORGANIZATION_PROFILE = gql`
  mutation UpdateOrganizationProfile($input: UpdateOrganizationInput!) {
    updateOrganizationProfile(input: $input) {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;