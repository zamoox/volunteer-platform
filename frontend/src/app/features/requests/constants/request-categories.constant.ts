export interface CategoryInfo {
  id: string;
  label: string;
  emoji: string;
  color: string; // Tailwind class
  hex: string;   // Для Leaflet
}

/**
 * ── ГОЛОВНІ КАТЕГОРІЇ (UN OCHA Кластери) ──────────────────────────────────
 * Оновлено та розширено відповідно до архітектури бекенду
 */
export const REQUEST_CATEGORIES: Record<string, CategoryInfo> = {
  MEDICAL: { id: 'MEDICAL', label: 'Медична допомога', emoji: '❤️', color: 'bg-red-500', hex: '#ef4444' },
  TRANSPORT: { id: 'TRANSPORT', label: 'Транспорт та логістика', emoji: '📦', color: 'bg-amber-500', hex: '#f59e0b' },
  FOOD: { id: 'FOOD', label: 'Продовольча безпека', emoji: '🍏', color: 'bg-emerald-500', hex: '#10b981' },
  SHELTER: { id: 'SHELTER', label: 'Житло та відновлення', emoji: '🏠', color: 'bg-violet-500', hex: '#8b5cf6' },
  PSYCHOSOCIAL: { id: 'PSYCHOSOCIAL', label: 'Психосоціальна підтримка', emoji: '🧠', color: 'bg-pink-500', hex: '#ec4899' },
  EDUCATION: { id: 'EDUCATION', label: 'Освіта', emoji: '🎓', color: 'bg-cyan-500', hex: '#06b6d4' },
  OTHER: { id: 'OTHER', label: 'Інші потреби', emoji: '🤝', color: 'bg-slate-500', hex: '#64748b' }
};

export const CATEGORIES_LIST = Object.values(REQUEST_CATEGORIES);

/**
 * ── СЛОВНИК ЛЮДСЬКИХ НАЗВ ДЛЯ ПІДКАТЕГОРІЙ ────────────────────────────────
 * Використовується для рендеру бейджів у списках та твоїх HTML-попапах
 */
export const REQUEST_SUBCATEGORIES_LABELS: Record<string, string> = {
  EMERGENCY_MEDICAL:     'Невідкладна мед. допомога',
  MEDICATIONS:           'Доставка ліків та медикаментів',
  MEDICAL_EQUIPMENT:     'Медичне обладнання / візки',
  MEDICAL_EVACUATION:    'Медична евакуація поранених',
  HUMANITARIAN_CARGO:    'Гуманітарний вантаж (Логістика)',
  DISPLACEMENT:          'Транспорт для виїзду / ВПО',
  TEMPORARY_SHELTER:     'Тимчасове житло / Притулок',
  DAMAGE_REPAIR:         'Ремонт вікон / даху (екстрений)',
  FOOD_PACKAGE:          'Продуктові набори довготривалі',
  HOT_MEALS:             'Гарячі обіди / польова кухня',
  PSYCHOLOGICAL_SUPPORT: 'Психологічна підтримка',
  DISTANCE_LEARNING:     'Ноутбуки та інтернет для уроків',
  UNCATEGORIZED:         'Загальний волонтерський запит'
};

/**
 * ── МАТРИЦЯ ДВОВЕКТОРНОГО КЛАСИФІКАТОРА ───────────────────────────────────
 * Поєднує підкатегорію з ідентифікатором головної категорії (ID з REQUEST_CATEGORIES)
 */
export const SUBCATEGORY_TO_CATEGORY_MAP: Record<string, string> = {
  EMERGENCY_MEDICAL:     'MEDICAL',
  MEDICATIONS:           'MEDICAL',
  MEDICAL_EQUIPMENT:     'MEDICAL',

  MEDICAL_EVACUATION:    'TRANSPORT',
  HUMANITARIAN_CARGO:    'TRANSPORT',
  DISPLACEMENT:          'TRANSPORT',

  TEMPORARY_SHELTER:     'SHELTER',
  DAMAGE_REPAIR:         'SHELTER',

  FOOD_PACKAGE:          'FOOD',
  HOT_MEALS:             'FOOD',

  PSYCHOLOGICAL_SUPPORT: 'PSYCHOSOCIAL',
  DISTANCE_LEARNING:     'EDUCATION',
  UNCATEGORIZED:         'OTHER'
};

// Додай до вашого файлу констант:

export interface PriorityGradation {
  level: 'CRITICAL' | 'WARNING' | 'LOW';
  label: string;
  badgeClass: string;   // Для Tailwind індикаторів пріоритету
  textClass: string;    // Для забарвлення тексту
  bgClass: string;      // Для бекграундів
}

export interface PriorityGradation {
  level: 'CRITICAL' | 'WARNING' | 'LOW';
  label: string;
  badgeClass: string;   // Для Tailwind індикаторів пріоритету
  textClass: string;    // Для забарвлення тексту
  bgClass: string;      // Для бекграундів
}

export function getPriorityGradation(score: number | undefined | null): PriorityGradation {
  const s = score ?? 0;

  if (s >= 0.75) {
    return {
      level: 'CRITICAL',
      label: '🚨 Критичний пріоритет',
      badgeClass: 'bg-red-100 text-red-700 border-red-200',
      textClass: 'text-red-600',
      bgClass: 'bg-red-50'
    };
  }
  
  if (s >= 0.45) {
    return {
      level: 'WARNING',
      label: '⚡ Високий пріоритет',
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
      textClass: 'text-amber-600',
      bgClass: 'bg-amber-50'
    };
  }

  return {
    level: 'LOW',
    label: '🤝 Стандартний пріоритет',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-50'
  };
}