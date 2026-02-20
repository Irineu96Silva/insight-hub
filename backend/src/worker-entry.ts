
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CloudflareAdapter } from './cloudflare/adapter';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

let appInstance: any;

async function bootstrap() {
  if (!appInstance) {
    const app = await NestFactory.create(AppModule, { bodyParser: false }); // Disable body parser as adapter handles it, or keep it if adapter mimics stream perfectly
    
    app.setGlobalPrefix('api');
    
    app.enableCors({
        origin: true, // Allow all for now, specific logic can be added
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    appInstance = app.getHttpAdapter().getInstance();
  }
  return appInstance;
}


import { workerContext } from './worker-context';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const app = await bootstrap();
    
    // Run the request handling within the context of the current env
    return workerContext.run(env, async () => {
        return CloudflareAdapter.handle(app, request, env, ctx);
    });
  }
};
