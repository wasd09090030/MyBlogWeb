import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Article } from '../article/article.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column()
  articleId: number;

  @ManyToOne('Article', 'comments', {
    onDelete: 'CASCADE',
  })
  article: Article;

  @Column({ nullable: true })
  parentId: number; // 支持回复功能

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 'pending' }) // pending, approved, rejected
  status: string;

  @Column({ nullable: true })
  userIp: string; // 记录用户IP

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
