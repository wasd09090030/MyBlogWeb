import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArticleSeedService } from './article/seed/article.seed';

async function Mybackend() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS

  // 运行种子脚本更新现有文章的类别
  try {
    const articleSeedService = app.get(ArticleSeedService);
    await articleSeedService.updateExistingArticles();
    console.log('成功更新文章类别');
  } catch (error) {
    console.error('更新文章类别失败:', error);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用已启动，监听端口: ${process.env.PORT ?? 3000}`);
}
void Mybackend();
