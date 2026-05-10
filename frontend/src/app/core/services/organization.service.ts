// src/app/core/services/organization.service.ts
import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

// ─── Queries ─────────────────────────────────────────────────

const MY_ORGANIZATION = gql`
  query MyOrganizationProfile {
    myOrganizationProfile {
      id
      name
      edrpou
      description
      website
      phone
      isVerified
      userId
      createdAt
    }
  }
`;

const CREATE_ORGANIZATION_PROFILE = gql`
  mutation CreateOrganizationProfile($input: CreateOrganizationInput!) {
    createOrganizationProfile(input: $input) {
      id
      name
      edrpou
      description
      website
      phone
      isVerified
      userId
      createdAt
    }
  }
`;

const UPDATE_ORGANIZATION_PROFILE = gql`
  mutation UpdateOrganizationProfile($input: UpdateOrganizationInput!) {
    updateOrganizationProfile(input: $input) {
      id
      name
      edrpou
      description
      website
      phone
      isVerified
    }
  }
`;

// ─── Types ───────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
  isVerified: boolean;
  userId: string;
  createdAt?: string;
  requests?: any[];
}

export interface CreateOrganizationInput {
  name: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  edrpou?: string;
  description?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
}

// ─── Service ─────────────────────────────────────────────────

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

  /** Створити профіль організації (тільки для role=organization) */
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
            data: { myOrganizationProfile: created }, // ← було myOrganization
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