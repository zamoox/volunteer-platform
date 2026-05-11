// src/organizations/organization-profile.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { VolunteerRequest } from 'src/requests/request.entity';

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

  @Field()
  @Column({ default: false })
  isVerified!: boolean;

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
}