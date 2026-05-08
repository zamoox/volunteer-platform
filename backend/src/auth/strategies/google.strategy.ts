import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    // super({
    //   clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
    //   clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
    //   callbackURL: 'http://localhost:3000/auth/google/callback', // Твій бекенд URL
    //   scope: ['email', 'profile'],
    // });

    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    console.log('--- GOOGLE STRATEGY INIT ---');
    console.log('ClientID exists:', !!clientID);

    super({
        clientID: clientID,
        clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
        callbackURL: 'http://localhost:3000/auth/google/callback',
        scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}