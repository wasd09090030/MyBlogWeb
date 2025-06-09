import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

// 定义文章类别枚举
export enum ArticleCategory {
  STUDY = 'study', // 学习
  GAME = 'game', // 游戏
  WORK = 'work', // 个人作品
  RESOURCE = 'resource', // 资源分享
  OTHER = 'other', // 其他
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  contentMarkdown: string;

  @Column({ nullable: true })
  coverImage: string; // 封面图URL

  @Column({
    type: 'varchar',
    enum: ArticleCategory,
    default: ArticleCategory.OTHER,
  })
  category: ArticleCategory;

  // 添加与评论的关联（延迟导入避免循环依赖）
  @OneToMany('Comment', 'article')
  comments: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
