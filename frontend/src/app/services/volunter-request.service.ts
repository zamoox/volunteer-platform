import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export const GET_ALL_REQUESTS = gql`
  query ExampleQuery {
    getAllRequests {  # Має бути саме так, як у твоєму Sandbox
      id
      title
      description
      location {
        lat
        lng
        address
      }
    }
  }
`;

// 2. Оновлюємо мутацію (Mutation)
const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateVolunteerRequestInput!) {
    createRequest(input: $input) {
      id
      title
      location {
        lat
        lng
        address
      }
    }
  }
`;


@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {
  
  constructor(
    private apollo: Apollo,
    private http: HttpClient
  ) {}

  getRequests() {
    return this.apollo.watchQuery<any>({
      query: GET_ALL_REQUESTS,
    }).valueChanges.pipe(
      map(result => {
        console.log('Повний результат від сервера:', result); // Лог для перевірки
        return result.data?.getAllRequests || []; // Безпечне повернення масиву
      })
    );
  }

  createRequest(title: string, description: string, lat: number, lng: number, address: string) {
    return this.apollo.mutate({
      mutation: CREATE_REQUEST,
      variables: {
        input: {
          title: title,
          description: description,
          category: 'OTHER', 
          location: {
            lat: lat,
            lng: lng,
            address: address // Додаємо це поле про всяк випадок
          }
        }
      },
      refetchQueries: ['ExampleQuery'] 
    });
  }

  getAddress(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=uk`;
    return this.http.get<any>(url);
  }
}