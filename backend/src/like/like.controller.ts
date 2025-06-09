import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { Request } from 'express';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('article/:articleId')
  async toggleArticleLike(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Req() req: Request,
  ) {
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';
    return this.likeService.toggleArticleLike(articleId, userIp);
  }

  @Get('article/:articleId/status')
  async getArticleLikeStatus(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Req() req: Request,
  ) {
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';
    return this.likeService.getArticleLikeStatus(articleId, userIp);
  }

  @Get('article/:articleId/count')
  async getArticleLikeCount(
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    const count = await this.likeService.getArticleLikeCount(articleId);
    return { count };
  }
}
