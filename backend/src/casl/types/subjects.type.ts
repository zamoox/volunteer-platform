import { InferSubjects } from '@casl/ability';
import { User } from '../../users/user.entity';
import { VolunteerRequest } from '../../requests/request.entity';

// Додай сюди всі сутності, для яких потрібна перевірка прав
export type Subjects = InferSubjects<typeof VolunteerRequest | typeof User> | 'all';
