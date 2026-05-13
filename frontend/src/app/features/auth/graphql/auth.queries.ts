import { gql } from "apollo-angular";
import { USER_FIELDS, RULE_FIELDS } from "./auth.fragments";

export const GET_PROFILE = gql`
  query GetProfile {
    me {
      user {
        id
        email
        firstName
        role
        city
        region
        isEmailVerified
        isTwoFactorEnabled
      }
      rules {
        action
        subject
        conditions
      }
    }
  }
`;