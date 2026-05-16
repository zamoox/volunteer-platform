import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import type { FetchResult, Observable } from '@apollo/client/core';
import { map } from 'rxjs/operators';
import { GET_ALL_REQUESTS, GET_MY_REQUESTS, GET_NEARBY_REQUESTS } from '../graphql/requests.queries';
import {
  CREATE_REQUEST,
  UPDATE_REQUEST,
  UPDATE_REQUEST_STATUS,
  DELETE_REQUEST,
  ACCEPT_REQUEST,
  COMPLETE_REQUEST_WITH_REVIEW,
} from '../graphql/requests.mutations';
import type { VolunteerRequest } from '../models/volunteer-request.model';
import type {
  CompleteRequestWithReviewMutationData,
  CreateRequestMutationData,
  GetAllRequestsQueryData,
  GetAllRequestsQueryVariables,
  GetMyRequestsQueryData,
} from '../graphql/requests.mutation-types';

export type VolunteerRequestUpdatePayload = Partial<
  Pick<
    VolunteerRequest,
    'title' | 'description' | 'category' | 'status' | 'coords' | 'address'
  >
>;

@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {
  constructor(private apollo: Apollo) {}

  getAllRequests(category: string | null = null) {
    const variables: GetAllRequestsQueryVariables = {
      category: category ?? null,
    };

    return this.apollo
      .watchQuery<GetAllRequestsQueryData, GetAllRequestsQueryVariables>({
        query: GET_ALL_REQUESTS,
        variables,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result): VolunteerRequest[] => {
          const list = result.data?.getAllRequests;
          return Array.isArray(list) ? (list as VolunteerRequest[]) : [];
        }),
      );
  }

  createRequest(
    title: string,
    description: string,
    lat: number,
    lng: number,
    address: string,
    category: string,
  ) {
    return this.apollo.mutate<CreateRequestMutationData>({
      mutation: CREATE_REQUEST,
      variables: {
        input: { title, description, category, coords: { lat, lng }, address },
      },
      update: (cache, result: FetchResult<CreateRequestMutationData>) => {
        const newRequest = result.data?.createRequest;
        if (!newRequest) return;

        const existing = cache.readQuery<GetAllRequestsQueryData>({
          query: GET_ALL_REQUESTS,
          variables: { category: null },
        });

        if (existing?.getAllRequests) {
          cache.writeQuery<GetAllRequestsQueryData>({
            query: GET_ALL_REQUESTS,
            variables: { category: null },
            data: {
              getAllRequests: [...existing.getAllRequests, newRequest],
            },
          });
        }
      },
    });
  }

  getMyRequests() {
    return this.apollo
      .watchQuery<GetMyRequestsQueryData>({
        query: GET_MY_REQUESTS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result): VolunteerRequest[] => {
          const list = result.data?.getMyRequests;
          return Array.isArray(list) ? (list as VolunteerRequest[]) : [];
        }),
      );
  }

  getNearbyRequests(lat: number, lng: number, radius: number): Observable<VolunteerRequest[]> {
    return this.apollo.query<{ getNearbyRequests: VolunteerRequest[] }>({
      query: GET_NEARBY_REQUESTS,
      variables: { lat, lng, radius },
      fetchPolicy: 'network-only' // Для мапи завжди беремо актуальні дані з мережі
    }).pipe(
      map(result => result.data?.getNearbyRequests ?? [])
    ); 
  }

  updateRequest(id: string, updates: VolunteerRequestUpdatePayload) {
    return this.apollo.mutate({
      mutation: UPDATE_REQUEST,
      variables: {
        input: { id, ...updates }
      },
      // Оновлюємо кеш, щоб зміни миттєво з'явилися в списку
      refetchQueries: [
        { query: GET_MY_REQUESTS },
        { query: GET_ALL_REQUESTS, variables: { category: null } },
      ],
    });
  }

  // 3. Видалення запиту
  deleteRequest(id: string) {
    return this.apollo.mutate({
      mutation: DELETE_REQUEST,
      variables: { id },
      // Після видалення просимо Apollo перепитати список "Мої запити"
      refetchQueries: [
        { query: GET_MY_REQUESTS },
        { query: GET_ALL_REQUESTS, variables: { category: null } },
      ],
    });
  }

  // 4. Відгук волонтера (Accept)
  acceptRequest(requestId: string) {
    return this.apollo.mutate({
      mutation: ACCEPT_REQUEST,
      variables: { requestId },
      refetchQueries: [
        { query: GET_ALL_REQUESTS, variables: { category: null } },
        { query: GET_MY_REQUESTS },
      ],
    });
  }

  completeRequestWithReview(
    requestId: string,
    rating: number,
    comment?: string,
  ) {
    return this.apollo.mutate<CompleteRequestWithReviewMutationData>({
      mutation: COMPLETE_REQUEST_WITH_REVIEW,
      variables: { input: { requestId, rating, comment } },
      refetchQueries: [
        { query: GET_ALL_REQUESTS, variables: { category: null } },
        { query: GET_MY_REQUESTS },
      ],
    });
  }

  // Твій існуючий метод для зміни статусу (для Організації/Адміна)
  updateStatus(id: string, status: string) {
    return this.apollo.mutate({
      mutation: UPDATE_REQUEST_STATUS,
      variables: { id, status },
      refetchQueries: [
        { query: GET_MY_REQUESTS },
        { query: GET_ALL_REQUESTS, variables: { category: null } },
      ],
    });
  }

  getCategories() {
    return [
      { id: 'FOOD', label: '🍎 Продукти', color: '#ef4444' },
      { id: 'MEDICINE', label: '💊 Ліки', color: '#10b981' },
      { id: 'TRANSPORT', label: '🚗 Транспорт', color: '#3b82f6' },
      { id: 'SHELTER', label: '🏠 Житло', color: '#f59e0b' },
      { id: 'OTHER', label: '📦 Інше', color: '#6b7280' }
    ];
  }
}