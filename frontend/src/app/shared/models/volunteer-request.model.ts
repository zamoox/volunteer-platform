export interface VolunteerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'closed'; // Додаємо типи для статусів
  createdAt: string | Date; // GraphQL зазвичай повертає рядок ISO, який ми можемо перетворити на Date
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}