import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';
import { UserRole } from '../enums/user-role.enum';
// import { Organization } from '../organizations/organization.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @HideField()
  @Column()
  password!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Field({ nullable: true }) // Робимо видимим для GraphQL
  @Column({ nullable: true }) // Додаємо в колонку БД
  phone?: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VOLUNTEER,
  })
  role!: UserRole;

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
  @Column({ default: false, nullable: false })
  isEmailVerified: boolean = false

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiresAt: Date;

  @HideField()
  @Column({ nullable: true })
  twoFactorSecret?: string;

  @Field(() => Boolean, { nullable: true })
  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @HideField()
  @Column({ type: 'simple-array', nullable: true })
  twoFactorRecoveryCodes?: string[];

  // Зв'язок: якщо роль ORGANIZATION — тут буде профіль організації
  // @Field(() => Organization, { nullable: true })
  // @OneToOne(() => Organization, (org) => org.user, { nullable: true, eager: true })
  // organization?: Organization;
}