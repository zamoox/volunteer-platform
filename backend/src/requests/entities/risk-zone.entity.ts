import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import type { MultiPolygon } from 'geojson';

export enum RiskLevel {
  GREEN = 'GREEN',       // Тил (коефіцієнт 1.0)
  POSSIBLE = 'POSSIBLE',   // Території можливих бойових дій (коефіцієнт 1.3)
  ACTIVE = 'ACTIVE',     // Території активних бойових дій (коефіцієнт 1.6)
  OCCUPIED = 'OCCUPIED'  // Тимчасово окуповані рф території (коефіцієнт 2.0)
}

@Entity('risk_zones')
export class RiskZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  regionName: string; // Назва області / громади

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.GREEN,
    name: 'risk_level'
  })
  riskLevel: RiskLevel;

  // Зберігаємо полігон межі території у форматі PostGIS geometry
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
  })
  @Index({ spatial: true }) // Просторовий індекс для швидкого пошуку порівнянь
  boundary: MultiPolygon;
}