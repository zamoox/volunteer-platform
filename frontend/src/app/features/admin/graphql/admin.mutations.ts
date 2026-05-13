import { gql } from "apollo-angular";

export const BAN_USER = gql`
  mutation BanUser($input: BanUserInput!) {
    adminBanUser(input: $input)
  }
`;