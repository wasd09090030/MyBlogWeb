import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArticleSeedService } from './article/seed/article.seed';

async function Mybackend() {
  const app = await NestFactory.create(AppModule);

  // 配置 CORS - 更安全的生产环境设置
  app.enableCors({
    origin: [
      'http://47.239.206.115', // 生产环境前端地址
      'http://47.239.206.115:80', // 明确指定端口 80
      'http://localhost:5174', // 开发环境地址
      'http://127.0.0.1:5174', // 本地开发地址
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, // 如果需要发送 cookies
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 运行种子脚本更新现有文章的类别
  try {
    const articleSeedService = app.get(ArticleSeedService);
    await articleSeedService.updateExistingArticles();
    console.log('成功更新文章类别');
  } catch (error) {
    console.error('更新文章类别失败:', error);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`应用已启动，监听端口: ${process.env.PORT ?? 3000}`);
  console.log(
    `外部访问地址: http://47.239.206.115:${process.env.PORT ?? 3000}`,
  );
}
void Mybackend();
