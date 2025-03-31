from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import config_by_name
import os

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
    
    # 配置应用
    app.config.from_object(config_by_name[config_name])
    
    # 确保SQLite数据库目录存在
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    
    # 创建所有表并初始化数据
    with app.app_context():
        # 确保数据库文件存在并创建所有表
        db.create_all()
        
        # 导入种子数据模块
        from app.seed import seed_data
        from app.models.user import User
        
        # 检查users表是否有数据
        try:
            user_count = db.session.query(User).count()
            if user_count == 0:
                # 导入并初始化种子数据
                seed_data()
        except Exception as e:
            print(f"检查用户表出错: {str(e)}")
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
    
    return app 