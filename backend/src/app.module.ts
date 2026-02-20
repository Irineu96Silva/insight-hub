import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { SystemsModule } from './modules/systems/systems.module';
import { EndpointsModule } from './modules/endpoints/endpoints.module';
import { DataCollectorModule } from './modules/data-collector/data-collector.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { LlmModule } from './modules/llm/llm.module';
import { NetworkTestsModule } from './modules/network-tests/network-tests.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';

import { User } from './modules/users/entities/user.entity';
import { System } from './modules/systems/entities/system.entity';
import { Endpoint } from './modules/endpoints/entities/endpoint.entity';
import { CollectedData } from './modules/data-collector/entities/collected-data.entity';
import { Insight } from './modules/ai-engine/entities/insight.entity';
import { AiLog } from './modules/ai-engine/entities/ai-log.entity';
import { AiUsage } from './modules/ai-engine/entities/ai-usage.entity';
import { LlmProvider } from './modules/llm/entities/llm-provider.entity';

import { NetworkTest } from './modules/network-tests/entities/network-test.entity';
import { SystemFile } from './modules/systems/entities/system-file.entity';

import { SeederModule } from './modules/seeder/seeder.module';

import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, System, Endpoint, CollectedData, Insight, AiLog, AiUsage, LlmProvider, NetworkTest, SystemFile],
        synchronize: true, // Auto-create tables (Dev only)
        ssl: configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        extra: {
          // Necessário para o Supabase Pooler (Supavisor)
          options: `-c search_path=public`,
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    SystemsModule,
    EndpointsModule,
    DataCollectorModule,
    AiEngineModule,
    LlmModule,
    DashboardModule,
    AuthModule,
    NetworkTestsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
