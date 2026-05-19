export enum RiskLevel {
  GREEN = 'GREEN',
  POSSIBLE = 'POSSIBLE',
  ACTIVE = 'ACTIVE',
  OCCUPIED = 'OCCUPIED'
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
  { name: 'Зона активних бойових дій', lat: 46.6354, lng: 32.6169, weight: 1.6, radiusMeters: 45000, level: RiskLevel.ACTIVE }, 
  { name: 'Тимчасово окуповані території', lat: 48.0159, lng: 37.8028, weight: 2.0, radiusMeters: 60000, level: RiskLevel.OCCUPIED }, 
  { name: 'Зона можливих бойових дій', lat: 49.9935, lng: 36.2304, weight: 1.3, radiusMeters: 30000, level: RiskLevel.POSSIBLE }
];