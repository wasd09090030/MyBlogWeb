import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleCategory } from './article.entity';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async findAll(): Promise<Article[]> {
    return this.articleRepository.find({
      order: { id: 'DESC' }, // 按ID倒序，新文章在前
    });
  }

  // 分页查询
  async findWithPagination(
    category?: ArticleCategory,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .orderBy('article.id', 'DESC'); // 按ID倒序

    if (category) {
      queryBuilder.where('article.category = :category', { category });
    }

    const [articles, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 摘要模式查询 - 只返回必要字段
  async findAllSummary(
    category?: ArticleCategory,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .select([
        'article.id',
        'article.title',
        'article.coverImage',
        'article.category',
        'article.createdAt',
        'article.updatedAt',
      ])
      .orderBy('article.id', 'DESC');

    if (category) {
      queryBuilder.where('article.category = :category', { category });
    }

    const [articles, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 推荐文章 - 专为轮播区域设计，随机返回有封面图的文章
  async findFeatured(limit: number = 5) {
    // 先获取所有有封面图的文章
    const articlesWithCover = await this.articleRepository
      .createQueryBuilder('article')
      .select([
        'article.id',
        'article.title',
        'article.coverImage',
        'article.category',
        'article.createdAt',
      ])
      .where('article.coverImage IS NOT NULL')
      .andWhere('article.coverImage != :empty', { empty: '' })
      .andWhere('article.coverImage != :null', { null: 'null' })
      .getMany();

    // 如果文章数量少于或等于需要的数量，直接返回所有文章
    if (articlesWithCover.length <= limit) {
      return articlesWithCover;
    }

    // 使用 Fisher-Yates 洗牌算法随机选择文章
    const shuffled = [...articlesWithCover];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  }

  async findByCategory(category: ArticleCategory): Promise<Article[]> {
    return this.articleRepository.find({
      where: { category },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const article = this.articleRepository.create(createArticleDto);
    return this.articleRepository.save(article);
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleRepository.preload({
      id: id,
      ...updateArticleDto,
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return this.articleRepository.save(article);
  }

  async remove(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
  }
}
