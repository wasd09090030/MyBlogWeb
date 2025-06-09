import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  articleId: number;

  @Column()
  userIdentifier: string; // IP地址或用户标识

  @Column({ default: 'article' }) // article, comment
  type: string;

  @Column({ nullable: true })
  targetId: number; // 文章ID或评论ID

  @CreateDateColumn()
  createdAt: Date;
}
