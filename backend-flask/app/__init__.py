from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import config_by_name
import os
import logging
from logging.handlers import RotatingFileHandler

# 初始化扩展
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_name='development'):
    """
    创建Flask应用
    :param config_name: 配置名称，默认为开发环境
    :return: Flask应用实例
    """
    app = Flask(__name__)
    
    # 从配置文件和环境变量加载配置
    app.config.from_object(config_by_name[config_name])
    
    # 确保日志目录存在
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 配置日志
    log_file = os.path.join(log_dir, 'flask.log')
    
    # 创建日志处理器
    file_handler = RotatingFileHandler(log_file, maxBytes=10485760, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    
    # 设置应用日志
    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.info('街舞社API服务启动')
    
    # 确保SQLite数据库目录存在
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    # 初始化扩展
    db.init_app(app)
    CORS(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # 创建所有表并初始化数据
    with app.app_context():
        # 导入种子数据模块
        from app.seed import seed_data
        from app.models.user import User
        
        # 处理命令行参数
        import sys
        if '--reset-db' in sys.argv:
            app.logger.info('收到重置数据库命令，正在重置数据库...')
            db.drop_all()
            db.create_all()
            seed_data()
            app.logger.info('数据库重置完成')
        else:
            # 确保数据库文件存在并创建所有表
            db.create_all()
            
            # 检查users表是否有数据
            try:
                user_count = db.session.query(User).count()
                if user_count == 0:
                    app.logger.info('初始化数据库...')
                    # 导入并初始化种子数据
                    seed_data()
            except Exception as e:
                app.logger.error(f"检查用户表出错: {str(e)}")
                # 尝试强制创建表
                db.create_all()
                seed_data()
    
    # 注册蓝图
    from app.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 注册用户认证蓝图
    from app.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # 注册根路由
    @app.route('/')
    def index():
        return jsonify({
            'message': '欢迎使用街舞社官网后端API',
            'status': 'success'
        })
    
    # 注册JWT错误处理
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': '令牌已过期',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': '无效的令牌',
            'error': 'invalid_token'
        }), 401
    
    app.logger.info('应用初始化完成')
    return app 