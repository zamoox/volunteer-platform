import { InferSubjects } from "@casl/ability";
import { VolunteerRequest } from "src/requests/request.entity";
import { User } from "src/users/user.entity";

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

// export type Subjects = 'VolunteerRequest' | 'User' | 'OrganizationProfile' | 'all';

export type Subjects = InferSubjects<typeof VolunteerRequest | typeof User> | 'VolunteerRequest' | 'all';
