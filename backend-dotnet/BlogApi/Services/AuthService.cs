using BlogApi.DTOs;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace BlogApi.Services
{
    public class AuthService
    {
        private readonly string _passwordFilePath;
        private const string DefaultUsername = "admin";
        private const string DefaultPassword = "admin123"; // 默认密码

        public AuthService(IWebHostEnvironment env)
        {
            _passwordFilePath = Path.Combine(env.ContentRootPath, "admin-password.enc");
            
            // 如果密码文件不存在,创建默认密码
            if (!File.Exists(_passwordFilePath))
            {
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(DefaultPassword);
                File.WriteAllText(_passwordFilePath, hashedPassword);
            }
        }

        public AuthResponse ValidateAdmin(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return new AuthResponse { Success = false, Message = "用户名和密码不能为空" };
            }

            if (username != DefaultUsername)
            {
                return new AuthResponse { Success = false, Message = "用户名或密码错误" };
            }

            try
            {
                var storedHash = File.ReadAllText(_passwordFilePath);
                
                if (BCrypt.Net.BCrypt.Verify(password, storedHash))
                {
                    return new AuthResponse { Success = true, Message = "登录成功" };
                }
                else
                {
                    return new AuthResponse { Success = false, Message = "用户名或密码错误" };
                }
            }
            catch (Exception ex)
            {
                return new AuthResponse { Success = false, Message = $"验证失败: {ex.Message}" };
            }
        }

        public AuthResponse ChangePassword(string currentPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
            {
                return new AuthResponse { Success = false, Message = "密码不能为空" };
            }

            if (newPassword.Length < 6)
            {
                return new AuthResponse { Success = false, Message = "新密码长度至少为6个字符" };
            }

            try
            {
                var storedHash = File.ReadAllText(_passwordFilePath);
                
                if (!BCrypt.Net.BCrypt.Verify(currentPassword, storedHash))
                {
                    return new AuthResponse { Success = false, Message = "当前密码错误" };
                }

                var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                File.WriteAllText(_passwordFilePath, newHash);

                return new AuthResponse { Success = true, Message = "密码修改成功" };
            }
            catch (Exception ex)
            {
                return new AuthResponse { Success = false, Message = $"密码修改失败: {ex.Message}" };
            }
        }
    }
}
