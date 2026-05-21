import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import type { MultiPolygon } from 'geojson';

export enum RiskLevel {
  SAFE = 'SAFE',               // r_z = 0.0
  FRONTLINE = 'FRONTLINE',     // r_z = 0.5
  ACTIVE_WAR = 'ACTIVE_WAR'    // r_z = 1.0
}

@ObjectType()
@Entity('risk_zones')
export class RiskZone {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ comment: 'Назва області або громади' })
  regionName: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.SAFE, // Виправлено з GREEN на SAFE
    name: 'risk_level'
  })
  riskLevel: RiskLevel;

  // Сирі координати зазвичай не віддають у GraphQL (вони заважкі), 
  // тому тут немає декоратора @Field()
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
    comment: 'Полігон зони ризику'
  })
  @Index({ spatial: true })
  boundary: MultiPolygon;

  // Геттер для GraphQL, щоб фронтенд бачив конкретну цифру ризику
  @Field(() => Float, { nullable: true })
  get riskCoefficient(): number {
    switch (this.riskLevel) {
      case RiskLevel.ACTIVE_WAR: return 1.0;
      case RiskLevel.FRONTLINE: return 0.5;
      case RiskLevel.SAFE:
      default: return 0.0;
    }
  }
}