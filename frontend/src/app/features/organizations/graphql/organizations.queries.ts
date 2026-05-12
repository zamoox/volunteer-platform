import { gql } from "apollo-angular";
import { ORGANIZATION_FIELDS } from "./organizations.fragments";

export const MY_ORGANIZATION = gql`
  query MyOrganizationProfile {
    myOrganizationProfile {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FIELDS}
`;