import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Article, ArticleCategory } from './article.entity';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(createArticleDto);
  }

  @Get()
  findAll(
    @Query('category') category?: ArticleCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('summary') summary?: boolean,
  ) {
    // 如果请求摘要模式，只返回基本字段
    if (summary === true) {
      return this.articleService.findAllSummary(category, page, limit);
    }

    // 支持分页查询
    if (page || limit) {
      return this.articleService.findWithPagination(category, page, limit);
    }

    // 兼容原有逻辑
    if (category) {
      return this.articleService.findByCategory(category);
    }
    return this.articleService.findAll();
  }

  @Get('featured')
  findFeatured(@Query('limit') limit?: number) {
    return this.articleService.findFeatured(limit || 5);
  }

  @Get('category/:category')
  findByCategory(
    @Param('category') category: ArticleCategory,
  ): Promise<Article[]> {
    return this.articleService.findByCategory(category);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Article> {
    return this.articleService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.articleService.remove(id);
  }
}
