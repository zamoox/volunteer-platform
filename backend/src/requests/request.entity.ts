import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity';

@ObjectType()
export class Location {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;

  @Field({ nullable: true })
  address?: string;
}

export enum RequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

  @Field(() => Location)
  @Column('jsonb')
  location!: Location;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

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
}

