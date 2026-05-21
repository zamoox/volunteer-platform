export enum RiskLevel {
  SAFE = 'SAFE',               // r_z = 0.0 (Безпечний тил)
  FRONTLINE = 'FRONTLINE',     // r_z = 0.5 (Прифронтова / Деокупована зона)
  ACTIVE_WAR = 'ACTIVE_WAR'    // r_z = 1.0 (Активні бойові дії / Тимчасово окуповані території)
}

export interface RiskZone {
  name: string;
  lat: number;
  lng: number;
  weight: number;
  radiusMeters: number;
  level: RiskLevel;
}

export const RISK_ZONES_CONFIG: RiskZone[] = [
  { 
    name: 'Активні бойові дії (Південь/Схід)', 
    lat: 46.6354, 
    lng: 32.6169, 
    weight: 1.0, // Оновлено з 1.6
    radiusMeters: 45000, 
    level: RiskLevel.ACTIVE_WAR 
  }, 
  { 
    name: 'Тимчасова окупація (Донбас/Крим)', 
    lat: 48.0159, 
    lng: 37.8028, 
    weight: 1.0, // Оновлено з 2.0
    radiusMeters: 60000, 
    level: RiskLevel.ACTIVE_WAR 
  }, 
  { 
    name: 'Прифронтова зона', 
    lat: 49.9935, 
    lng: 36.2304, 
    weight: 0.5, // Оновлено з 1.3
    radiusMeters: 30000, 
    level: RiskLevel.FRONTLINE 
  }
];