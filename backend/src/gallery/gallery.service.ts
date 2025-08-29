import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gallery } from './gallery.entity';
import { CreateGalleryDto, UpdateGalleryDto } from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Gallery)
    private galleryRepository: Repository<Gallery>,
  ) {}

  // 获取所有激活的画廊图片（公开接口）
  async findAllActive(): Promise<Gallery[]> {
    return await this.galleryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  // 获取所有画廊图片（管理员接口）
  async findAll(): Promise<Gallery[]> {
    return await this.galleryRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  // 根据 ID 获取画廊图片
  async findOne(id: number): Promise<Gallery> {
    const gallery = await this.galleryRepository.findOne({
      where: { id },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${id} not found`);
    }

    return gallery;
  }

  // 创建画廊图片
  async create(createGalleryDto: CreateGalleryDto): Promise<Gallery> {
    const gallery = this.galleryRepository.create({
      ...createGalleryDto,
      sortOrder: createGalleryDto.sortOrder || 0,
      isActive:
        createGalleryDto.isActive !== undefined
          ? createGalleryDto.isActive
          : true,
    });

    return await this.galleryRepository.save(gallery);
  }

  // 更新画廊图片
  async update(
    id: number,
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<Gallery> {
    const gallery = await this.findOne(id);

    Object.assign(gallery, updateGalleryDto);

    return await this.galleryRepository.save(gallery);
  }

  // 删除画廊图片
  async remove(id: number): Promise<void> {
    const gallery = await this.findOne(id);
    await this.galleryRepository.remove(gallery);
  }

  // 批量更新排序
  async updateSortOrder(
    updates: { id: number; sortOrder: number }[],
  ): Promise<void> {
    const promises = updates.map(({ id, sortOrder }) =>
      this.galleryRepository.update(id, { sortOrder }),
    );

    await Promise.all(promises);
  }

  // 切换激活状态
  async toggleActive(id: number): Promise<Gallery> {
    const gallery = await this.findOne(id);
    gallery.isActive = !gallery.isActive;
    return await this.galleryRepository.save(gallery);
  }
}
