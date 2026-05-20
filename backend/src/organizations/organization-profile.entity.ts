// src/organizations/organization-profile.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { VolunteerRequest } from 'src/requests/request.entity';
import { OrganizationStatus } from './enums/organization-status.enum';

@ObjectType()
@Entity('organization_profiles')
export class OrganizationProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ nullable: false })
  name!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  edrpou?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.PENDING,
  })
  status!: OrganizationStatus;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => String)
  @Column()
  userId!: string;
    
  @OneToMany(() => VolunteerRequest, (req) => req.organization)
  requests!: VolunteerRequest[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  documents?: string[];
}