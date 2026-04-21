import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';

// Описуємо наш GraphQL запит
const GET_ALL_REQUESTS = gql`
  query GetAllRequests {
    getAllRequests {
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

@Injectable({ providedIn: 'root' })
export class VolunteerRequestService {
  constructor(private apollo: Apollo) {}

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
}