import {
  MongoAbility,
  AbilityClass,
  PureAbility,
} from '@casl/ability';

import { Action } from '../enums/actions.enum';
import { Subjects } from './subjects.type';

export type AppAbility = MongoAbility<
  [Action, Subjects]
>;

export const AppAbility =
  PureAbility as AbilityClass<AppAbility>;