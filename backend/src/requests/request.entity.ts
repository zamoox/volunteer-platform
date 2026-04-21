// backend/src/requests/request.entity.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@ObjectType() // Для GraphQL

@ObjectType()
export class Location {
  @Field(() => Float)
  lat!: number; // Додано !

  @Field(() => Float)
  lng!: number; // Додано !

  @Field({ nullable: true })
  address?: string;
}

@ObjectType()
@Entity()
export class VolunteerRequest {
  
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid') // Авто-генерація UUID
  id!: string; // Додано !

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column('text')
  description!: string;

  @Field()
  @Column()
  category!: string;

  @Field()
  @Column({ default: 'pending' })
  status!: string;

  @Field(() => Location)
  @Column('jsonb') // Зберігаємо локацію як JSON-об'єкт
  location!: Location;

  @Field()
  @CreateDateColumn() // Авто-дата створення
  createdAt!: Date;
}