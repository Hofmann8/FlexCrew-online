import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from flask import current_app
import traceback

# 从环境变量获取邮件服务配置
MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true'
MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')  # 邮箱授权码

def generate_verification_code():
    """生成6位数字验证码"""
    return ''.join(random.choices('0123456789', k=6))

def get_verification_code_expiry():
    """获取验证码过期时间（10分钟后）"""
    return datetime.utcnow() + timedelta(minutes=10)

def is_valid_dlut_email(email):
    """验证是否为大连理工大学邮箱"""
    return email.endswith('@mail.dlut.edu.cn')

def send_verification_email(to_email, verification_code):
    """发送验证码邮件
    
    Args:
        to_email: 接收邮件的地址
        verification_code: 验证码
        
    Returns:
        bool: 是否发送成功
    """
    # 记录启动发送邮件的请求
    current_app.logger.info(f"开始邮件发送过程，目标邮箱: {to_email}")
    
    # 检查收件人邮箱格式 - 只为普通社员进行验证
    if to_email.endswith('@mail.dlut.edu.cn'):
        # 这是学生邮箱，需要验证
        current_app.logger.info(f"邮箱 {to_email} 是有效的大连理工大学邮箱")
    else:
        # 非学生邮箱，可能是管理员或领队的邮箱，记录但允许发送
        current_app.logger.warning(f"邮箱 {to_email} 不是大连理工大学邮箱，但仍继续发送")
    
    # 检查邮件服务配置
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        current_app.logger.error("邮件服务未配置，请设置环境变量 MAIL_USERNAME 和 MAIL_PASSWORD")
        return False
    
    # 记录邮件配置信息（不包含密码）
    current_app.logger.info(f"邮件配置: 服务器={MAIL_SERVER}, 端口={MAIL_PORT}, SSL={MAIL_USE_SSL}, TLS={MAIL_USE_TLS}, 用户名={MAIL_USERNAME}")
    
    # 邮件内容
    subject = "街舞社账号注册验证码"
    body = f"""
    <html>
    <body>
        <p>您好，</p>
        <p>感谢您注册大连理工大学街舞社！您的验证码是：</p>
        <h2 style="color: #4A90E2;">{verification_code}</h2>
        <p>验证码有效期为10分钟，请尽快完成验证。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        <p>——大连理工大学街舞社 FlexCrew</p>
    </body>
    </html>
    """
    
    # 创建邮件
    message = MIMEMultipart()
    message['From'] = MAIL_USERNAME
    message['To'] = to_email
    message['Subject'] = subject
    
    # 添加HTML内容
    message.attach(MIMEText(body, 'html'))
    
    try:
        current_app.logger.info("正在连接到SMTP服务器...")
        
        # 连接到SMTP服务器
        if MAIL_USE_SSL:
            current_app.logger.info(f"使用SSL连接到 {MAIL_SERVER}:{MAIL_PORT}")
            server = smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT)
        else:
            current_app.logger.info(f"使用普通连接到 {MAIL_SERVER}:{MAIL_PORT}")
            server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
            if MAIL_USE_TLS:
                current_app.logger.info("启用TLS加密")
                server.starttls()  # 启用TLS加密
        
        # 登录
        current_app.logger.info(f"正在登录邮箱账号: {MAIL_USERNAME}")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        
        # 发送邮件
        current_app.logger.info(f"正在发送邮件到: {to_email}")
        server.send_message(message)
        
        # 关闭连接
        current_app.logger.info("关闭SMTP连接")
        server.quit()
        
        current_app.logger.info(f"成功发送验证码到 {to_email}")
        return True
    
    except Exception as e:
        current_app.logger.error(f"发送邮件失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return False 