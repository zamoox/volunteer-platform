import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';

// Запити винесені в константи (краще тримати їх в окремому файлі .graphql або constants.ts)
export const GET_ALL_REQUESTS = gql`
  query ExampleQuery($category: String) {
    getAllRequests(category: $category) {
      id
      title
      description
      category
      status
      createdAt
      location {
        lat
        lng
        address
      }
    }
  }
`;

const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateVolunteerRequestInput!) {
    createRequest(input: $input) {
      id
      title
      category
      description
      status
      createdAt
      location {
        lat
        lng
        address
      }
    }
  }
`;

const UPDATE_REQUEST_STATUS = gql`
  mutation UpdateRequestStatus($id: String!, $status: String!) {
    updateRequestStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {
  constructor(private apollo: Apollo) {}

  getRequests(category: string | null = null) {
    return this.apollo.watchQuery<any>({
      query: GET_ALL_REQUESTS,
      variables: { category }
    }).valueChanges.pipe(map(result => result.data?.getAllRequests ?? []));
  }

  createRequest(title: string, description: string, lat: number, lng: number, address: string, category: string) {
    return this.apollo.mutate({
    mutation: CREATE_REQUEST,
    variables: {
      input: { title, description, category, location: { lat, lng, address } }
    },
    // Вручну оновлюємо кеш для миттєвого відображення
    update: (cache, { data }: any) => {
      const newRequest = data?.createRequest;
      if (!newRequest) return;

      // Читаємо поточний стан кешу для запиту GET_ALL_REQUESTS
      const existingRequests: any = cache.readQuery({
        query: GET_ALL_REQUESTS,
        variables: { category: null } // Переконайся, що змінні збігаються з тими, що в watchQuery
      });

      if (existingRequests) {
        // Записуємо оновлений список назад у кеш
        cache.writeQuery({
          query: GET_ALL_REQUESTS,
          variables: { category: null },
          data: {
            getAllRequests: [...existingRequests.getAllRequests, newRequest]
          }
        });
      }
    }
  });
}

  updateStatus(id: string, status: string) {
    return this.apollo.mutate({
      mutation: UPDATE_REQUEST_STATUS,
      variables: { id, status },
      refetchQueries: ['GetAllRequests']
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