import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article/article.entity';
import { Comment } from './comment/comment.entity';
import { Like } from './like/like.entity';
import { Gallery } from './gallery/gallery.entity';
import { ArticleModule } from './article/article.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { GalleryModule } from './gallery/gallery.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'blog.sqlite',
      entities: [Article, Comment, Like, Gallery],
      synchronize: true,
    }),
    ArticleModule,
    CommentModule,
    LikeModule,
    GalleryModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
