import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { RequestsModule } from './requests/requests.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // ВИМКНИ старий Playground, щоб не тригерити помилку пакетів
      playground: false, 
      csrfPrevention: false,
      // ВВІМКНИ вбудований Sandbox
      plugins: [ApolloServerPluginLandingPageLocalDefault()], // Вмикаємо новий Sandbox
    }),
    RequestsModule,
  ],
})
export class AppModule {}