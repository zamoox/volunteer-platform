import { registerEnumType } from '@nestjs/graphql';

export enum ModerationAction {
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  VERIFY_ORG = 'VERIFY_ORG',
  REJECT_ORG = 'REJECT_ORG',
  DELETE_REQUEST = 'DELETE_REQUEST',
}

registerEnumType(ModerationAction, {
  name: 'ModerationAction',
});