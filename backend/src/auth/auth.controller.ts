import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, AuthResponse } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const result = await this.authService.validateAdmin(
        loginDto.username,
        loginDto.password,
      );
      
      if (!result.success) {
        throw new HttpException(
          result.message || '登录失败',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return { success: true, message: '登录成功' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        '服务器内部错误',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto): Promise<AuthResponse> {
    try {
      const result = await this.authService.changePassword(
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      if (!result.success) {
        throw new HttpException(
          result.message || '密码修改失败',
          HttpStatus.BAD_REQUEST,
        );
      }

      return { success: true, message: result.message };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        '服务器内部错误',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
