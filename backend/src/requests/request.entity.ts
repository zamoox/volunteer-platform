import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity';
import { RequestStatus } from './enums/request-status.enum';
import type { Point } from 'typeorm';
import { RequestSubcategory } from './enums/request-category.enum';

@ObjectType()
export class Location {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field({ nullable: true })
  address?: string;
}

@ObjectType()
@Entity('volunteer_requests')
export class VolunteerRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column('text')
  description!: string;

  @Field()
  @Column()
  category!: string;

  @Field(() => String)
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.OPEN })
  status!: RequestStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @Index({ spatial: true }) // ГІС-індекс для миттєвого пошуку поруч
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // Стандартна система координат WGS84
    nullable: true,
  })
  location!: Point;

  @Field(() => Location, { nullable: true })
  get coords(): Location | null {
    if (!this.location || !this.location.coordinates) return null;
    return {
      lng: this.location.coordinates[0],
      lat: this.location.coordinates[1]
    };
  }

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => RequestSubcategory, { nullable: true })
  @Column({
    type: 'enum',
    enum: RequestSubcategory,
    nullable: true,
  })
  subcategory?: RequestSubcategory;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'float',
    nullable: true,
  })
  priorityScore?: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'float',
    nullable: true,
  })
  zoneRiskCoefficient?: number;

  @Field(() => [String], { nullable: true })
  @Column({
    type: 'text',
    array: true,
    nullable: true,
    comment: 'Автотеги від VBT-алгоритму',
  })
  autoTags?: string[];

  // --- Зв'язки ---
  
  @Field(() => OrganizationProfile, { nullable: true })
  @ManyToOne(() => OrganizationProfile, (org) => org.requests, {
    eager: true,
    nullable: false, // якщо запит завжди має організацію
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationProfile;

  @Field(() => String)
  @Column()
  organizationId!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  volunteerId?: string;

  /** Зберігає userId волонтера; зв'язок з профілем через userId профілю */
  @Field(() => VolunteerProfile, { nullable: true })
  @ManyToOne(() => VolunteerProfile, { eager: true, nullable: true })
  @JoinColumn({ name: 'volunteerId', referencedColumnName: 'userId' })
  volunteer?: VolunteerProfile;

  @Field(() => Review, { nullable: true })
  @OneToOne(() => Review, (review) => review.volunteerRequest)
  review?: Review;

  @Field(() => Float, { nullable: true })
  distance_m?: number;
}

