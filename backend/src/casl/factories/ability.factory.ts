// backend/src/auth/casl/factories/casl-ability.factory.ts
import { 
  AbilityBuilder, 
  createMongoAbility, 
  ExtractSubjectType, 
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { Action } from '../enums/actions.enum';
import { Subjects } from '../types/subjects.type';
import { VolunteerRequest } from 'src/requests/request.entity';
import { AppAbility } from '../types/app-ability.type';

@Injectable()
export class AbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'admin') {
      can(Action.Manage, 'all'); 
    } else if (user.role === 'organization') {
        can(Action.Create, VolunteerRequest);
        // Організація може оновлювати лише власні запити
        
        can(Action.Update, VolunteerRequest, { 
          'organization.userId': user.id 
        } as any);

        can(Action.Delete, VolunteerRequest, { 
          'organization.userId': user.id 
        } as any);
    } else if (user.role === 'volunteer') {
        can(Action.Read, 'all');
        // Дозволяємо волонтеру оновлювати запити, щоб він міг змінити статус на in_progress
        can(Action.Update, VolunteerRequest, { status: 'open' } as any);
      } else { 
        can(Action.Read, 'all');
      }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}