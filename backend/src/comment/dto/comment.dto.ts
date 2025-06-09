import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsString()
  author: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsNumber()
  articleId: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class UpdateCommentStatusDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: string;
}
