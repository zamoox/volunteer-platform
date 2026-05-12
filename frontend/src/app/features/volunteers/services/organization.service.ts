// src/app/core/services/organization.service.ts
import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '@features/organizations/types/organization.types';
import { MY_ORGANIZATION } from '@features/organizations/graphql/organizations.queries';
import { CREATE_ORGANIZATION_PROFILE, UPDATE_ORGANIZATION_PROFILE } from '@features/organizations/graphql/organizations.mutations';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apollo = inject(Apollo);

  /** Профіль моєї організації (для залогіненого org-юзера) */
getMyOrganization(): Observable<Organization | null> {
  return this.apollo
    .watchQuery<any>({ // ← any замість строгого типу
      query: MY_ORGANIZATION,
      fetchPolicy: 'network-only',
    })
    .valueChanges.pipe(
      map((r: any) => r.data?.myOrganizationProfile ?? null)
    );
}

// getAllOrganizations(): Observable<Organization[]> {
//   return this.apollo
//     .watchQuery<any>({ query: GET_ALL_ORGANIZATIONS })
//     .valueChanges.pipe(
//       map((r: any) => r.data?.getAllOrganizations ?? [])
//     );
// }

// getOrganizationById(id: string): Observable<Organization> {
//   return this.apollo
//     .watchQuery<any>({
//       query: GET_ORGANIZATION,
//       variables: { id },
//     })
//     .valueChanges.pipe(
//       map((r: any) => r.data?.organization)
//     );
// }

  createProfile(input: CreateOrganizationInput): Observable<Organization> {
    return this.apollo
      .mutate<any>({
        mutation: CREATE_ORGANIZATION_PROFILE,
        variables: { input },
        update: (cache, { data }) => {
          const created = data?.createOrganizationProfile;
          if (!created) return;
          cache.writeQuery({
            query: MY_ORGANIZATION,
            data: { myOrganizationProfile: created },
          });
        },
      })
      .pipe(map((r: any) => r.data.createOrganizationProfile));
  }

  /** Оновити профіль організації */
  updateProfile(input: UpdateOrganizationInput): Observable<Organization> {
    return this.apollo
      .mutate<{ updateOrganizationProfile: Organization }>({
        mutation: UPDATE_ORGANIZATION_PROFILE,
        variables: { input },
        refetchQueries: [{ query: MY_ORGANIZATION }],
      })
      .pipe(
        map(r => r.data!.updateOrganizationProfile)
      );
  }
}