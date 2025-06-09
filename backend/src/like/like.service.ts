import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  async toggleArticleLike(
    articleId: number,
    userIp: string,
  ): Promise<{ liked: boolean; count: number }> {
    const existingLike = await this.likeRepository.findOne({
      where: {
        articleId,
        userIdentifier: userIp,
        type: 'article',
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.likeRepository.remove(existingLike);
      const count = await this.getArticleLikeCount(articleId);
      return { liked: false, count };
    } else {
      // 添加点赞
      const like = this.likeRepository.create({
        articleId,
        userIdentifier: userIp,
        type: 'article',
        targetId: articleId,
      });
      await this.likeRepository.save(like);
      const count = await this.getArticleLikeCount(articleId);
      return { liked: true, count };
    }
  }

  async getArticleLikeCount(articleId: number): Promise<number> {
    return this.likeRepository.count({
      where: {
        articleId,
        type: 'article',
      },
    });
  }

  async isArticleLiked(articleId: number, userIp: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: {
        articleId,
        userIdentifier: userIp,
        type: 'article',
      },
    });
    return !!like;
  }

  async getArticleLikeStatus(
    articleId: number,
    userIp: string,
  ): Promise<{ count: number; isLiked: boolean }> {
    const count = await this.getArticleLikeCount(articleId);
    const isLiked = await this.isArticleLiked(articleId, userIp);
    return { count, isLiked };
  }
}
