import { gql } from "apollo-angular";

export const ORGANIZATION_FIELDS = gql`
  fragment OrganizationFields on OrganizationProfile {
    id
    name
    edrpou
    description
    website
    phone
    status
    userId
    createdAt
  }
`;