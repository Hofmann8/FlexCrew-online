#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
邮件服务测试模块
用法: python -m app.utils.test_email your-test-email@mail.dlut.edu.cn
"""

import sys
import os
import random
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# 创建一个临时的Flask应用，用于测试邮件发送
app = Flask(__name__)

if __name__ == "__main__":
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("用法: python -m app.utils.test_email your-test-email@mail.dlut.edu.cn")
        sys.exit(1)
    
    test_email = sys.argv[1]
    
    # 验证邮箱格式
    from app.utils.email import is_valid_dlut_email
    if not is_valid_dlut_email(test_email):
        print(f"错误: {test_email} 不是有效的大连理工大学邮箱（必须以 @mail.dlut.edu.cn 结尾）")
        sys.exit(1)
    
    # 生成测试验证码
    test_code = "".join(random.choices("0123456789", k=6))
    
    # 测试发送邮件
    with app.app_context():
        from app.utils.email import send_verification_email
        print(f"正在向 {test_email} 发送测试验证码: {test_code}")
        success = send_verification_email(test_email, test_code)
        
        if success:
            print("✓ 邮件发送成功！请检查您的邮箱。")
        else:
            print("✗ 邮件发送失败，请检查配置后重试。")
            print("提示：检查 .env 文件中的邮件配置是否正确，特别是 MAIL_PASSWORD 是否设置了有效的应用专用密码。") 