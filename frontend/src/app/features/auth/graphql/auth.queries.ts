import { gql } from "apollo-angular";
import { USER_FIELDS, RULE_FIELDS } from "./auth.fragments";

export const GET_PROFILE = gql`
  query GetProfile {
    me {
      user {
        ...UserFields
      }
      rules {
        ...RuleFields
      }
    }
  }
  ${USER_FIELDS}
  ${RULE_FIELDS}
`;