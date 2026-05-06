import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: number;

  @Field()
  @Column({ unique: true })
  email!: string;

  @HideField() // Пароль не світиться у GraphQL-відповідях
  @Column()
  password!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Field(() => String)
  @Column({ default: 'volunteer' })
  role!: string;

  // Нові поля для геолокації
  @Field({ nullable: true })
  @Column({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Boolean)
  @Column({ default: false })
  isEmailVerified: boolean; 

  @Column({ nullable: true })
  verificationToken: string; 

  @Column({ nullable: true })
  twoFactorAuthenticationSecret: string;

  @Column({ default: false })
  isTwoFactorAuthenticationEnabled: boolean;
}