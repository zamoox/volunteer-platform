import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    // 1. Обробляємо дані користувача в сервісі
    const result = await this.authService.validateGoogleUser(req.user);

    // 2. Редиректимо на фронтенд з токеном у URL
    const frontendUrl = 'http://localhost:4200/login'; 
    return res.redirect(`${frontendUrl}?token=${result.access_token}`);
  }
}