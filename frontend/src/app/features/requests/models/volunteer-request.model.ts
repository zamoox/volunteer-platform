import type { Volunteer } from '@features/volunteers/models/volunteer.model';

// Створюємо строгі тип-аліаси на основі ключів твоїх констант
export type RequestCategoryType = 'MEDICAL' | 'TRANSPORT' | 'FOOD' | 'SHELTER' | 'PSYCHOSOCIAL' | 'EDUCATION' | 'OTHER';

export type RequestSubcategoryType =
  | 'EMERGENCY_MEDICAL'
  | 'MEDICATIONS'
  | 'MEDICAL_EQUIPMENT'
  | 'MEDICAL_EVACUATION'
  | 'HUMANITARIAN_CARGO'
  | 'DISPLACEMENT'
  | 'TEMPORARY_SHELTER'
  | 'DAMAGE_REPAIR'
  | 'FOOD_PACKAGE'
  | 'HOT_MEALS'
  | 'PSYCHOLOGICAL_SUPPORT'
  | 'DISTANCE_LEARNING'
  | 'UNCATEGORIZED';

export interface RequestReview {
  id: string;
  __typename?: 'Review';
}

export interface VolunteerRequest {
  __typename?: 'VolunteerRequest';
  id: string;
  title: string;
  description: string;
  
  /** * ВЕКТОР 1: Головна категорія (Гуманітарний кластер ООН)
   * Наприклад: 'MEDICAL', 'TRANSPORT'
   */
  category: RequestCategoryType | string;
  
  /** * ВЕКТОР 2: Конкретна підкатегорія потреби 
   * Наприклад: 'EMERGENCY_MEDICAL', 'HOT_MEALS'
   */
  subcategory: RequestSubcategoryType | string;

  /** Динамічний рейтинг пріоритетності запиту (результат роботи алгоритму) */
  priorityScore?: number | null;
  
  /** Коефіцієнт ризику зони, де створено запит */
  zoneRiskCoefficient?: number | null;
  
  /** Автоматичні теги, згенеровані VBT-алгоритмом аналізу тексту */
  autoTags?: string[] | null;

  /** Відстань у метрах від поточного волонтера до запиту (обчислюється через PostGIS ST_Distance) */
  distance_m?: number | null;

  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  address: string;

  coords: {
    lat: number;
    lng: number;
    __typename?: 'Location';
  };

  organization?: {
    id: string;
    name: string;
    phone?: string | null;
    description?: string;
    userId: string;
    user?: {
      id: string;
      phone?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    __typename?: 'OrganizationProfile';
  };

  volunteer?: Volunteer | null;
  review?: RequestReview | null;
}