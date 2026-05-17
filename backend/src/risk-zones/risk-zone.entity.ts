// risk-zones/risk-zone.entity.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

export enum RiskLevel {
  SAFE        = 0,    // r_z = 0.0  — безпечна зона
  FRONTLINE   = 0.5,  // r_z = 0.5  — прифронтова / деокупована
  ACTIVE_WAR  = 1.0,  // r_z = 1.0  — активні бойові дії / окупація
}

@ObjectType()
@Entity('risk_zones')
export class RiskZone {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ comment: 'Назва зони (назва населеного пункту або регіону)' })
  name!: string;

  // Полігон зони ризику — geometry(Polygon, 4326)
  // НЕ додаємо @Field() — сирі геометрії не експонуємо в GraphQL
  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: false,
    comment: 'Межі зони відповідно до Наказу Мінреінтеграції № 309',
  })
  boundary!: object; // GeoJSON Polygon

  @Field(() => Float, {
    description: 'Коефіцієнт ризику r_z: 0 / 0.5 / 1.0 (формула 3.1)',
  })
  @Column({
    type: 'float',
    default: 0,
    comment: 'Коефіцієнт ризику зони: 0=безпечна, 0.5=прифронтова, 1.0=активна',
  })
  riskCoefficient!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  sourceReference?: string; // Посилання на Наказ Мінреінтеграції
}