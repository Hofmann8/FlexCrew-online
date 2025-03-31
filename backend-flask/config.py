import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()  # 加载.env文件中的环境变量

# 获取当前文件所在目录的绝对路径
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """基本配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
    # 使用绝对路径确保数据库文件位置正确
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'streetdance.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # 访问令牌过期时间
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # 刷新令牌过期时间

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)  # 开发环境下延长过期时间，方便调试

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False

# 根据环境变量选择配置
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig
}

# 默认使用开发环境配置
config = config_by_name.get(os.environ.get('FLASK_ENV', 'development'), DevelopmentConfig) 