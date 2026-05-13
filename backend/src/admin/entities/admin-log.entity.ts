import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { ModerationAction } from './moderation-action.enum';

@ObjectType()
@Entity('admin_logs')
export class AdminLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  adminId: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Field(() => ModerationAction)
  @Column({ type: 'enum', enum: ModerationAction })
  action: ModerationAction;

  @Field()
  @Column()
  targetId: string; // ID юзера, запиту або організації

  @Field()
  @Column('text')
  reason: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}