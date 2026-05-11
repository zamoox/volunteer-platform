// backend/src/auth/casl/factories/casl-ability.factory.ts
import { 
  AbilityBuilder, 
  createMongoAbility, 
  ExtractSubjectType, 
  MongoAbility 
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { Action } from '../enums/actions.enum';
import { Subjects } from '../types/subjects.type';
import { VolunteerRequest } from 'src/requests/request.entity';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'admin') {
      can(Action.Manage, 'all'); 
    } else if (user.role === 'organization') {
      can(Action.Create, VolunteerRequest);
      // Організація може оновлювати лише власні запити
      can(Action.Update, VolunteerRequest, { authorId: user.id } as any);
    } else {
      // Волонтер або гість
      can(Action.Read, 'all');
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}