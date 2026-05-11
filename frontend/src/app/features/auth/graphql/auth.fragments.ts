import { gql } from "apollo-angular";

export const USER_FIELDS = gql`
      fragment UserFields on User {
        id
        email
        firstName
        role
        city
        region
        isEmailVerified
        isTwoFactorEnabled
      }
`;

export const RULE_FIELDS = gql`
      fragment RuleFields on PermissionRule {
        action
        subject
        conditions
      }
`;