import { PartialType } from '@nestjs/mapped-types';
import { ArticleCategory } from '../article.entity';

export class CreateArticleDto {
  title: string;
  content: string;
  contentMarkdown?: string; // 添加存储Markdown原文的字段
  coverImage?: string; // 封面图URL
  category?: ArticleCategory; // 文章类别
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
