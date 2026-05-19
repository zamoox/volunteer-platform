import { gql } from "apollo-angular";
import { USER_FIELDS, RULE_FIELDS } from "./auth.fragments";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      require2FA       
      userId           
      message
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

export const LOGIN_WITH_2FA_MUTATION = gql`
  mutation LoginWith2FA($userId: String!, $code: String!) {
    loginWith2FA(userId: $userId, code: $code) {
      access_token
      require2FA       
      userId           
      message
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

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      access_token
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

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const GENERATE_2FA_MUTATION = gql`
  mutation Generate2FA($userId: String!) {
    generate2FA(userId: $userId)
  }
`;

export const TURN_ON_2FA_MUTATION = gql`
  mutation TurnOn2FA($userId: String!, $code: String!) {
    turnOn2FA(userId: $userId, code: $code)
  }
`;

export const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail($userId: String!) {
    resendVerificationEmail(userId: $userId)
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($userId: String!, $oldPassword: String!, $newPassword: String!) {
    changePassword(userId: $userId, oldPassword: $oldPassword, newPassword: $newPassword)
  }
`

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;