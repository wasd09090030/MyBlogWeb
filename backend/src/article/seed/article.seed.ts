import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleCategory } from '../article.entity';

@Injectable()
export class ArticleSeedService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  // 为文章随机分配类别的辅助函数
  private assignRandomCategory(): ArticleCategory {
    const categories = [
      ArticleCategory.STUDY,
      ArticleCategory.GAME,
      ArticleCategory.WORK,
      ArticleCategory.OTHER,
    ];
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }

  // 按标题关键词分配适当类别
  private assignCategoryByTitle(title: string): ArticleCategory {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes('学习') ||
      lowerTitle.includes('笔记') ||
      lowerTitle.includes('教程')
    ) {
      return ArticleCategory.STUDY;
    }

    if (
      lowerTitle.includes('游戏') ||
      lowerTitle.includes('攻略') ||
      lowerTitle.includes('测评')
    ) {
      return ArticleCategory.GAME;
    }

    if (
      lowerTitle.includes('项目') ||
      lowerTitle.includes('作品') ||
      lowerTitle.includes('成果')
    ) {
      return ArticleCategory.WORK;
    }

    return ArticleCategory.OTHER;
  }

  async updateExistingArticles(): Promise<void> {
    const articles = await this.articleRepository.find();

    for (const article of articles) {
      if (!article.category) {
        // 根据文章标题分配合适的类别
        article.category = this.assignCategoryByTitle(article.title);
        await this.articleRepository.save(article);
      }
    }

    console.log(`已更新 ${articles.length} 篇文章的类别`);
  }
}
