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
      organization {
        id
        name
        description
        userId
      }
      volunteer {
        id
        firstName
        lastName
      }
      location {
        lat
        lng
        address
      }
    }
  }
`;

const GET_MY_REQUESTS = gql`
  query GetMyRequests {
    getMyRequests {
      id
      title
      description
      category
      status
      createdAt
      location {
        address
      }
      organization {
        id
        userId  
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
      organization {
        id
        name
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

const UPDATE_REQUEST = gql`
  mutation UpdateRequest($input: UpdateVolunteerRequestInput!) {
    updateRequest(input: $input) {
      id
      title
      description
      category
    }
  }
`;

const DELETE_REQUEST = gql`
  mutation DeleteRequest($id: String!) {
    deleteRequest(id: $id)
  }
`;

const ACCEPT_REQUEST = gql`
  mutation AcceptRequest($requestId: String!) {
    acceptRequest(requestId: $requestId) {
      id
      status
      volunteer {
        id
        firstName
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {

  constructor(private apollo: Apollo) {}

  getAllRequests(category: string | null = null) {
    const vars = { category: category ?? null };

    return this.apollo.watchQuery<any>({
      query: GET_ALL_REQUESTS,
      variables: vars, // ← ключова зміна
      fetchPolicy: 'network-only', // ← додай щоб не брав з кешу
    }).valueChanges.pipe(
      map(result => result.data?.getAllRequests ?? [])
    );
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

  getMyRequests() {
    return this.apollo.watchQuery<any>({
      query: GET_MY_REQUESTS,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.getMyRequests ?? [])
    );
  }

  // 2. Повне редагування запиту
  updateRequest(id: string, updates: Partial<any>) {
    return this.apollo.mutate({
      mutation: UPDATE_REQUEST,
      variables: {
        input: { id, ...updates }
      },
      // Оновлюємо кеш, щоб зміни миттєво з'явилися в списку
      refetchQueries: [{ query: GET_MY_REQUESTS }, { query: GET_ALL_REQUESTS }]
    });
  }

  // 3. Видалення запиту
  deleteRequest(id: string) {
    return this.apollo.mutate({
      mutation: DELETE_REQUEST,
      variables: { id },
      // Після видалення просимо Apollo перепитати список "Мої запити"
      refetchQueries: [{ query: GET_MY_REQUESTS }, { query: GET_ALL_REQUESTS }]
    });
  }

  // 4. Відгук волонтера (Accept)
  acceptRequest(requestId: string) {
    return this.apollo.mutate({
      mutation: ACCEPT_REQUEST,
      variables: { requestId },
      refetchQueries: [{ query: GET_ALL_REQUESTS }]
    });
  }

  // Твій існуючий метод для зміни статусу (для Організації/Адміна)
  updateStatus(id: string, status: string) {
    return this.apollo.mutate({
      mutation: UPDATE_REQUEST_STATUS,
      variables: { id, status },
      refetchQueries: [{ query: GET_MY_REQUESTS }, { query: GET_ALL_REQUESTS }]
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