import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // 公开接口：获取所有激活的画廊图片
  @Get()
  findAllActive() {
    return this.galleryService.findAllActive();
  }

  // 管理员接口：获取所有画廊图片
  @Get('admin')
  findAll() {
    return this.galleryService.findAll();
  }

  // 管理员接口：获取单个画廊图片
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.galleryService.findOne(id);
  }

  // 管理员接口：创建画廊图片
  @Post()
  create(@Body() createGalleryDto: CreateGalleryDto) {
    return this.galleryService.create(createGalleryDto);
  }

  // 管理员接口：更新画廊图片
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, updateGalleryDto);
  }

  // 管理员接口：删除画廊图片
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.galleryService.remove(id);
  }

  // 管理员接口：批量更新排序
  @Patch('batch/sort-order')
  updateSortOrder(@Body() updates: { id: number; sortOrder: number }[]) {
    return this.galleryService.updateSortOrder(updates);
  }

  // 管理员接口：切换激活状态
  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.galleryService.toggleActive(id);
  }
}
