import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
import { SetContextLink } from '@apollo/client/link/context';

import { routes } from './app.routes';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { abilityProvider } from '@core/casl/providers/ability.provider';

export const appConfig: ApplicationConfig = {
providers: [
   provideApollo(() => {
      const uploadLink = new UploadHttpLink({ 
        uri: 'http://localhost:3000/graphql' 
      });

      // Використовуємо новий клас SetContextLink
      const authLink = new SetContextLink((prevContext, operation) => {
      const token = localStorage.getItem('auth_token');

      console.log('--- Apollo Auth Debug ---');
      console.log('Token found:', !!token);
      console.log('Full Context:', prevContext);
        
      return {
          ...prevContext,
          headers: {
            // Використовуємо ['headers'] і кастинг для TypeScript
            ...(prevContext['headers'] as Record<string, string>),
            Authorization: token ? `Bearer ${token}` : '',
          }
        };
      });

      return {
        link: ApolloLink.from([authLink, uploadLink]),
        cache: new InMemoryCache(),
      };
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor])
    ),
    abilityProvider
  ],
};
