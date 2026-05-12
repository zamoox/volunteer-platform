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
} from 'typeorm';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';

@ObjectType('Volunteer')
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

  @Field(() => [Review])
  @OneToMany(() => Review, (review) => review.volunteer)
  reviews!: Review[];
}