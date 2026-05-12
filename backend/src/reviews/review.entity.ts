import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { OrganizationProfile } from '../organizations/organization-profile.entity';
import { VolunteerProfile } from '../volunteers/volunteer-profile.entity';
import { VolunteerRequest } from '../requests/request.entity';

@ObjectType()
@Entity('reviews')
export class Review {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  rating!: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Field(() => OrganizationProfile)
  @ManyToOne(() => OrganizationProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationProfile;

  @Field(() => String)
  @Column()
  organizationId!: string;

  @Field(() => VolunteerProfile)
  @ManyToOne(() => VolunteerProfile, (v) => v.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volunteerProfileId' })
  volunteer!: VolunteerProfile;

  @Field(() => String)
  @Column()
  volunteerProfileId!: string;

  @Field(() => VolunteerRequest)
  @OneToOne(() => VolunteerRequest, (req) => req.review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volunteerRequestId' })
  volunteerRequest!: VolunteerRequest;

  @Field(() => String)
  @Column({ unique: true })
  volunteerRequestId!: string;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}
