import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentStatusDto } from './dto/comment.dto';
import { Request } from 'express';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';
    return this.commentService.create(createCommentDto, userIp);
  }

  @Get('article/:articleId')
  async findByArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.commentService.findByArticle(articleId);
  }

  @Get('admin/all')
  async findAll() {
    return this.commentService.findAll();
  }

  @Get('admin/pending')
  async findPending() {
    return this.commentService.findPending();
  }

  @Patch('admin/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateCommentStatusDto,
  ) {
    return this.commentService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/like')
  async like(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.like(id);
  }

  @Delete('admin/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.remove(id);
  }
}
