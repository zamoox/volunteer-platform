import {
  ObjectType,
  Field,
  ID,
  Float,
  Int,
} from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Point } from 'typeorm';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { VolunteerRequest } from 'src/requests/request.entity';

@ObjectType()
export class VolunteerCoords {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}

@ObjectType()
@Entity('volunteer_profiles')
export class VolunteerProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field(() => Float)
  @Column({ type: 'double precision', default: 0 })
  averageRating!: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  completedRequestsCount!: number;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => User)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => String)
  @Column()
  userId!: string;

  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, (review) => review.volunteer)
  reviews?: Review[];

  @Field(() => [VolunteerRequest], { nullable: 'itemsAndList' })
  activeTasks?: VolunteerRequest[];

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: Point;

  @Field(() => VolunteerCoords, { nullable: true })
  get coords(): VolunteerCoords | null {
    if (!this.location?.coordinates) return null;

    return {
      lng: this.location.coordinates[0],
      lat: this.location.coordinates[1],
    };
  }
  
  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

}