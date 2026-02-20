import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/, // Allow local network 192.168.x.x
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:8080$/, // Allow local network 10.x.x.x
    ].filter((origin) => !!origin),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
