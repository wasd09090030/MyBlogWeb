import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
  private readonly adminPasswordFile = path.join(process.cwd(), 'admin-password.enc');
  private readonly defaultPassword = '86280630qq'; // 初始密码，仅用于首次设置

  constructor() {
    this.initializePasswordFile();
  }

  /**
   * 初始化密码文件
   * 如果文件不存在，创建默认加密密码文件
   */
  private initializePasswordFile() {
    if (!fs.existsSync(this.adminPasswordFile)) {
      const hashedPassword = this.hashPassword(this.defaultPassword);
      fs.writeFileSync(this.adminPasswordFile, hashedPassword, 'utf8');
      console.log('Admin password file initialized with default password');
    }
  }

  /**
   * 对密码进行加密
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * 验证密码
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
      return hash === verifyHash;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * 读取存储的密码哈希
   */
  private getStoredPasswordHash(): string | null {
    try {
      if (fs.existsSync(this.adminPasswordFile)) {
        return fs.readFileSync(this.adminPasswordFile, 'utf8').trim();
      }
      return null;
    } catch (error) {
      console.error('Error reading password file:', error);
      return null;
    }
  }

  /**
   * 验证管理员登录
   */
  async validateAdmin(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    // 验证用户名
    if (username !== 'admin') {
      return { success: false, message: '用户名错误' };
    }

    // 获取存储的密码哈希
    const storedHash = this.getStoredPasswordHash();
    if (!storedHash) {
      return { success: false, message: '系统错误：无法读取密码文件' };
    }

    // 验证密码
    const isValid = this.verifyPassword(password, storedHash);
    if (isValid) {
      return { success: true };
    } else {
      return { success: false, message: '密码错误' };
    }
  }

  /**
   * 更改管理员密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    // 先验证当前密码
    const validation = await this.validateAdmin('admin', currentPassword);
    if (!validation.success) {
      return { success: false, message: '当前密码错误' };
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
      return { success: false, message: '新密码长度至少6位' };
    }

    try {
      // 加密新密码并保存
      const hashedPassword = this.hashPassword(newPassword);
      fs.writeFileSync(this.adminPasswordFile, hashedPassword, 'utf8');
      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: '密码修改失败' };
    }
  }
}
