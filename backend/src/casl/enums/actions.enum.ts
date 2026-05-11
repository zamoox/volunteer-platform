export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects = 'VolunteerRequest' | 'User' | 'OrganizationProfile' | 'all';