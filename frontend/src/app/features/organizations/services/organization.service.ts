// src/app/core/services/organization.service.ts
import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '@features/organizations/types/organization.types';
import { MY_ORGANIZATION } from '@features/organizations/graphql/organizations.queries';
import { CREATE_ORGANIZATION_PROFILE, UPDATE_ORGANIZATION_PROFILE } from '@features/organizations/graphql/organizations.mutations';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apollo = inject(Apollo);

  /** Отримати профіль поточної організації */
  getMyOrganization(): Observable<Organization | null> {
    return this.apollo
      .watchQuery<any>({
        query: MY_ORGANIZATION,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        // Додаємо відладочний лог, щоб побачити, що саме приходить з бекенду
        tap(r => console.log('Raw Organization Data:', r.data)),
        map((r: any) => r.data?.myOrganizationProfile ?? null)
      );
  }

  createProfile(input: CreateOrganizationInput): Observable<Organization> {
    return this.apollo
      .mutate<any>({
        mutation: CREATE_ORGANIZATION_PROFILE,
        variables: { input },
        update: (cache, { data }) => {
          const created = data?.createOrganizationProfile;
          if (!created) return;

          // Оновлюємо локальний кеш Apollo, щоб UI відразу побачив профіль
          cache.writeQuery({
            query: MY_ORGANIZATION,
            data: { myOrganizationProfile: created },
          });
        },
      })
      .pipe(map((r: any) => r.data.createOrganizationProfile));
  }
  
  // Додай цей метод для компонента setup, щоб уникнути помилки 409
  hasProfile(): Observable<boolean> {
    return this.getMyOrganization().pipe(
      map(profile => !!profile)
    );
  }
}