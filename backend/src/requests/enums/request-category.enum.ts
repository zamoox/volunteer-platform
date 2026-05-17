// src/requests/enums/request-subcategory.enum.ts
import { registerEnumType } from '@nestjs/graphql';

/**
 * ── ВЕКТОР 1: ГОЛОВНІ КАТЕГОРІЇ ─────────────────────────────────────────────
 * Строго відповідають методології гуманітарних кластерів ООН (UN OCHA Cluster Approach)
 */
export enum RequestCategory {
  MEDICAL       = 'MEDICAL',
  TRANSPORT     = 'TRANSPORT',
  FOOD          = 'FOOD',
  SHELTER       = 'SHELTER',
  PSYCHOSOCIAL  = 'PSYCHOSOCIAL',
  EDUCATION     = 'EDUCATION',
  OTHER         = 'OTHER',
}

registerEnumType(RequestCategory, {
  name: 'RequestCategory',
  description: 'Верхньорівнева класифікація за гуманітарними кластерами ООН (UN OCHA)',
});

/**
 * ── ВЕКТОР 2: ПІДКАТЕГОРІЇ ──────────────────────────────────────────────────
 * Деталізують специфіку потреби для точної роботи математичної моделі пріоритетності
 */
export enum RequestSubcategory {
  // MEDICAL
  EMERGENCY_MEDICAL     = 'EMERGENCY_MEDICAL',
  MEDICATIONS           = 'MEDICATIONS',
  MEDICAL_EQUIPMENT     = 'MEDICAL_EQUIPMENT',
  // TRANSPORT
  MEDICAL_EVACUATION    = 'MEDICAL_EVACUATION',
  HUMANITARIAN_CARGO    = 'HUMANITARIAN_CARGO',
  DISPLACEMENT          = 'DISPLACEMENT',
  // SHELTER
  TEMPORARY_SHELTER     = 'TEMPORARY_SHELTER',
  DAMAGE_REPAIR         = 'DAMAGE_REPAIR',
  // FOOD
  FOOD_PACKAGE          = 'FOOD_PACKAGE',
  HOT_MEALS             = 'HOT_MEALS',
  // PSYCHOSOCIAL
  PSYCHOLOGICAL_SUPPORT = 'PSYCHOLOGICAL_SUPPORT',
  // EDUCATION
  DISTANCE_LEARNING     = 'DISTANCE_LEARNING',
  // OTHER
  UNCATEGORIZED         = 'UNCATEGORIZED',
}

registerEnumType(RequestSubcategory, {
  name: 'RequestSubcategory',
  description: 'Нижньорівнева декомпозиція: конкретна підкатегорія волонтерського запиту',
});

/**
 * СЛОВНИК ВАГ ПІДКАТЕГОРІЙ — відображає внутрішню критичність (w_c у формулі 3.1)
 */
export const SUBCATEGORY_WEIGHTS: Record<RequestSubcategory, number> = {
  [RequestSubcategory.EMERGENCY_MEDICAL]:     1.00,
  [RequestSubcategory.MEDICAL_EVACUATION]:    0.95,
  [RequestSubcategory.MEDICATIONS]:           0.85,
  [RequestSubcategory.MEDICAL_EQUIPMENT]:     0.80,
  [RequestSubcategory.TEMPORARY_SHELTER]:     0.75,
  [RequestSubcategory.FOOD_PACKAGE]:          0.70,
  [RequestSubcategory.HOT_MEALS]:             0.65,
  [RequestSubcategory.HUMANITARIAN_CARGO]:    0.60,
  [RequestSubcategory.PSYCHOLOGICAL_SUPPORT]: 0.60,
  [RequestSubcategory.DISPLACEMENT]:          0.55,
  [RequestSubcategory.DAMAGE_REPAIR]:         0.50,
  [RequestSubcategory.DISTANCE_LEARNING]:     0.40,
  [RequestSubcategory.UNCATEGORIZED]:         0.30,
};

/**
 * СЛОВНИК ДВОВЕКТОРНОГО МАПІНГУ — зв'язує підкатегорію з батьківським кластером
 */
export const SUBCATEGORY_TO_CATEGORY_MAP: Record<RequestSubcategory, RequestCategory> = {
  [RequestSubcategory.EMERGENCY_MEDICAL]:     RequestCategory.MEDICAL,
  [RequestSubcategory.MEDICATIONS]:           RequestCategory.MEDICAL,
  [RequestSubcategory.MEDICAL_EQUIPMENT]:     RequestCategory.MEDICAL,

  [RequestSubcategory.MEDICAL_EVACUATION]:    RequestCategory.TRANSPORT,
  [RequestSubcategory.HUMANITARIAN_CARGO]:    RequestCategory.TRANSPORT,
  [RequestSubcategory.DISPLACEMENT]:          RequestCategory.TRANSPORT,

  [RequestSubcategory.TEMPORARY_SHELTER]:     RequestCategory.SHELTER,
  [RequestSubcategory.DAMAGE_REPAIR]:         RequestCategory.SHELTER,

  [RequestSubcategory.FOOD_PACKAGE]:          RequestCategory.FOOD,
  [RequestSubcategory.HOT_MEALS]:             RequestCategory.FOOD,

  [RequestSubcategory.PSYCHOLOGICAL_SUPPORT]: RequestCategory.PSYCHOSOCIAL,
  [RequestSubcategory.DISTANCE_LEARNING]:     RequestCategory.EDUCATION,
  [RequestSubcategory.UNCATEGORIZED]:         RequestCategory.OTHER,
};