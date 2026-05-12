export interface CategoryInfo {
  id: string;
  label: string;
  emoji: string;
  color: string; // Tailwind class
  hex: string;   // Для Leaflet/Canvas якщо треба
}

export const REQUEST_CATEGORIES: Record<string, CategoryInfo> = {
  FOOD: { id: 'FOOD', label: 'Продукти', emoji: '🍎', color: 'bg-red-500', hex: '#ef4444' },
  MEDICINE: { id: 'MEDICINE', label: 'Ліки', emoji: '💊', color: 'bg-emerald-500', hex: '#10b981' },
  TRANSPORT: { id: 'TRANSPORT', label: 'Транспорт', emoji: '🚗', color: 'bg-blue-500', hex: '#3b82f6' },
  SHELTER: { id: 'SHELTER', label: 'Житло', emoji: '🏠', color: 'bg-amber-500', hex: '#f59e0b' },
  OTHER: { id: 'OTHER', label: 'Інше', emoji: '📦', color: 'bg-slate-500', hex: '#6b7280' }
};

export const CATEGORIES_LIST = Object.values(REQUEST_CATEGORIES);