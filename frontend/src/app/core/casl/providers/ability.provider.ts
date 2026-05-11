import { createMongoAbility, mongoQueryMatcher, PureAbility } from '@casl/ability';
import { AppAbility } from '../types/app-ability.type';

// export const abilityProvider = {
//   provide: AppAbility,
//   useValue: createMongoAbility(),
// };

export const abilityProvider = {
  provide: PureAbility,
  useFactory: (): AppAbility => {
    return createMongoAbility(undefined, {
      conditionsMatcher: mongoQueryMatcher,
      resolveAction: (action) => action,
      detectSubjectType: (item: any) => {
        if (item && item.__typename) return item.__typename;
        return item?.constructor?.name || item;
      },
    });
  },
};