import { gql } from 'apollo-angular';

export const UPDATE_VOLUNTEER_LOCATION = gql`
  mutation UpdateVolunteerLocation($lat: Float!, $lng: Float!) {
    updateVolunteerLocation(lat: $lat, lng: $lng) {
      id
      userId
      coords {
        lat
        lng
      }
      # Якщо у профілі є поле lastActiveAt, залишаємо його. 
      # Якщо раптом бекенд його не віддає — просто видали цей рядок.
      lastActiveAt 
    }
  }
`;