from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from config import config_by_name
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import timedelta
import sys

# 初始化扩展
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()

def create_app(config_name='development'):
    """
    创建Flask应用
    :param config_name: 配置名称，默认为开发环境
    :return: Flask应用实例
    """
    app = Flask(__name__)
    
    # 从配置文件和环境变量加载配置
    app.config.from_object(config_by_name[config_name])
    
    # JWT Cookie设置
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']  # 同时从headers和cookies中获取token
    app.config['JWT_COOKIE_SECURE'] = False  # 在生产环境设为True以要求HTTPS
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # 简化调试，生产环境可设为True
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
    app.config['JWT_COOKIE_SAMESITE'] = None  # 允许跨站请求
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token_cookie'
    # 增加JWT token过期时间，默认只有15分钟
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)  # 设置为1天
    # 不要在run_fixed.py中再次初始化CORS，避免冲突
    app.config['CORS_ALREADY_INITIALIZED'] = False
    
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
    migrate.init_app(app, db)
    
    # 如果CORS尚未初始化，才进行初始化
    if not app.config.get('CORS_ALREADY_INITIALIZED', False):
        # 增强CORS配置，完全支持跨域请求
        CORS(app, 
            supports_credentials=True,  # 支持跨域Cookie
            origins=["http://localhost:3000", "http://localhost:8080", "http://124.222.106.161:3000", "http://124.222.106.161:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080"],  # 指定允许的源
            allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            expose_headers=["Content-Disposition", "Set-Cookie"]  # 添加Set-Cookie到暴露的头部
        )
        app.config['CORS_ALREADY_INITIALIZED'] = True
    
    jwt.init_app(app)
    bcrypt.init_app(app)
    
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
        print(f"\n===== JWT过期错误 =====", file=sys.stderr)
        print(f"头部: {jwt_header}", file=sys.stderr)
        print(f"有效载荷: {jwt_payload}", file=sys.stderr)
        print(f"用户ID: {jwt_payload.get('sub')}", file=sys.stderr)
        print(f"过期时间: {jwt_payload.get('exp')}", file=sys.stderr)
        print("=========================\n", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': '令牌已过期',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"\n===== JWT无效错误 =====", file=sys.stderr)
        print(f"错误信息: {error}", file=sys.stderr)
        print("=========================\n", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': '无效的令牌',
            'error': 'invalid_token'
        }), 401
        
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"\n===== JWT缺失错误 =====", file=sys.stderr)
        print(f"错误信息: {error}", file=sys.stderr)
        print(f"请求路径: {request.path}", file=sys.stderr)
        print(f"请求方法: {request.method}", file=sys.stderr)
        print(f"请求头部: {dict(request.headers)}", file=sys.stderr)
        print("=========================\n", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': '缺少认证令牌',
            'error': 'missing_token'
        }), 401
    
    app.logger.info('应用初始化完成')
    return app 