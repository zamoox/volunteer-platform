import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';
import { VolunteerRequest } from '../requests/request.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @HideField() // Пароль не буде доступний через GraphQL запити
  @Column()
  password!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Field(() => String)
  @Column({ default: 'volunteer' }) // Ролі: volunteer, coordinator, admin
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}