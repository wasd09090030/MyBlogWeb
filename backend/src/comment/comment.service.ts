import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto, UpdateCommentStatusDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userIp: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      userIp,
      status: 'pending', // 默认待审核
    });
    return this.commentRepository.save(comment);
  }

  async findByArticle(articleId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: {
        articleId,
        status: 'approved', // 只返回已审核通过的评论
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Comment[]> {
    return this.commentRepository.find({
      relations: ['article'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { status: 'pending' },
      relations: ['article'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateCommentStatusDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    comment.status = updateStatusDto.status;
    return this.commentRepository.save(comment);
  }

  async like(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    comment.likes += 1;
    return this.commentRepository.save(comment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('评论不存在');
    }
  }
}
