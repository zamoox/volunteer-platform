import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Додай цей імпорт
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { join } from 'path';

async function bootstrap() {
  // Вказуємо тип <NestExpressApplication>, щоб отримати доступ до app.useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), { 
    prefix: '/uploads',
    index: false, // Забороняємо відкривати список файлів папки
    immutable: true, // Кешування
  });

  // 2. Middleware для GraphQL Upload
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })); 
  
  // 3. CORS для твого Angular фронтенду
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();