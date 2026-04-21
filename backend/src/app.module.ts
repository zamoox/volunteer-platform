import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { RequestsModule } from './requests/requests.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { RequestsResolver } from './requests/requests.resolver';
import { VolunteerRequest } from './requests/request.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // Твій юзер (за замовчуванням postgres)
      password: 'password', // Твій пароль
      database: 'volunteer_db',
      autoLoadEntities: true, // Автоматично знайде наші класи @Entity
      synchronize: true, // АВТОМАТИЧНО створить таблиці (тільки для розробки!)
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // ВИМКНИ старий Playground, щоб не тригерити помилку пакетів
      playground: false, 
      csrfPrevention: false,
      // ВВІМКНИ вбудований Sandbox
      plugins: [ApolloServerPluginLandingPageLocalDefault()], // Вмикаємо новий Sandbox
    }),
    RequestsModule
  ],
  providers: []
})
export class AppModule {}