#!/usr/bin/env python
import os
import sys
from dotenv import load_dotenv
from datetime import timedelta

# 打印诊断信息
print("\n===== 数据库配置诊断 =====")
print(f"1. 加载环境变量...") 
load_dotenv(override=True)
print(f"2. 环境变量加载完成")

# 导入Flask应用工厂
from app import create_app, db

# 创建应用
app = create_app()

# 检查CORS是否已经初始化
if not app.config.get('CORS_ALREADY_INITIALIZED', False):
    # 增强CORS配置以解决跨域认证问题
    from flask_cors import CORS
    CORS(app, 
        supports_credentials=True,  # 确保支持凭据
        origins=["http://localhost:3000", "http://localhost:8080", "http://124.222.106.161:3000", "http://124.222.106.161:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080"],  # 指定允许的源
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        expose_headers=["Content-Disposition", "Set-Cookie"],  # 关键：暴露Set-Cookie头
        send_wildcard=True  # 发送通配符响应
    )
    app.config['CORS_ALREADY_INITIALIZED'] = True

# JWT设置增强
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']  # 同时检查头部和Cookie
app.config['JWT_COOKIE_SECURE'] = False                    # 非HTTPS也可以使用Cookie
app.config['JWT_COOKIE_CSRF_PROTECT'] = False              # 禁用CSRF保护以简化调试
app.config['JWT_COOKIE_SAMESITE'] = None                   # 允许跨站Cookie
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1) # 设置为1天

# 添加JWT无感刷新中间件，确保每个请求都会自动延长token有效期
from flask import g, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, create_access_token, set_access_cookies

@app.before_request
def refresh_token_if_valid():
    """尝试刷新JWT令牌，如果请求中含有有效令牌"""
    try:
        # 跳过OPTIONS请求和不需要认证的端点
        if request.method == 'OPTIONS' or request.path == '/api/auth/login' or request.path.startswith('/auth-debug'):
            return
        
        # 尝试验证JWT，但不强制要求
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            
            # 如果成功获取到用户ID，自动刷新令牌
            if user_id:
                # 生成新令牌
                new_token = create_access_token(identity=str(user_id))
                g.refresh_token = new_token  # 存储在g对象中，以便在after_request中使用
        except Exception:
            # 验证失败时不做任何处理，让原有的认证机制处理
            pass
    except Exception:
        # 整个刷新过程出错时不做任何事情
        pass

@app.after_request
def set_refreshed_token(response):
    """在响应中设置刷新的令牌"""
    try:
        if hasattr(g, 'refresh_token'):
            set_access_cookies(response, g.refresh_token)
    except Exception:
        pass
    return response

print(f"3. 应用配置成功")
print("===========================\n")

# 添加认证调试工具
from auth_check import register_auth_debug
auth_debug_bp = register_auth_debug(app)
print("认证调试工具已加载")

# 添加Cookie调试工具
from check_cookie import setup_cookie_routes
setup_cookie_routes(app)
print("Cookie调试工具已加载")

# 添加自定义认证调试路由
@app.route('/auth-debug-legacy')
def auth_debug_legacy():
    from flask import jsonify
    return jsonify({
        'headers': dict(request.headers),
        'cookies': dict(request.cookies),
        'server_info': {
            'host': request.host,
            'origin': request.origin if hasattr(request, 'origin') else None,
            'remote_addr': request.remote_addr,
            'scheme': request.scheme,
        }
    })

print("认证调试路由已注册: /auth-debug-legacy")

# 添加令牌修复路由
@app.route('/fix-tokens')
def fix_tokens():
    """紧急修复Bearer令牌和Cookie同步问题"""
    from flask import jsonify
    from flask_jwt_extended import get_jwt_identity, create_access_token, set_access_cookies
    
    # 尝试获取当前用户身份
    current_user_id = get_jwt_identity()
    auth_header = request.headers.get('Authorization', '')
    
    # 如果没有认证，返回错误
    if not current_user_id and not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': '未检测到有效认证信息'
        }), 401
    
    # 如果没有jwt身份但有Authorization头，尝试解析令牌
    if not current_user_id and auth_header.startswith('Bearer '):
        from flask_jwt_extended import decode_token
        try:
            token = auth_header[7:]  # 去掉'Bearer '前缀
            decoded = decode_token(token)
            current_user_id = decoded.get('sub')
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'令牌解析失败: {str(e)}'
            }), 401
    
    # 创建新令牌
    new_token = create_access_token(identity=str(current_user_id))
    
    # 创建响应
    response = jsonify({
        'success': True,
        'message': '令牌已重新生成并同步',
        'token': new_token,
        'user_id': current_user_id
    })
    
    # 设置Cookie
    set_access_cookies(response, new_token)
    
    return response

if __name__ == '__main__':
    # 检查是否重置数据库
    if len(sys.argv) > 1 and sys.argv[1] == '--reset-db':
        print("开始重置数据库...")
        with app.app_context():
            db.drop_all()
            db.create_all()
            
            # 可以在这里添加初始数据导入
            try:
                from app.seed import seed_database
                seed_database()
                print("数据库已重置并填充初始数据")
            except Exception as e:
                print(f"填充初始数据时出错: {str(e)}")
        
        print("数据库重置完成!")
        sys.exit(0)
        
    print("\n启动街舞社官网后端API服务...")
    print("API服务地址: http://127.0.0.1:5000/")
    print("\n调试工具地址:")
    print("  认证调试: /auth-debug")
    print("  紧急令牌修复: /fix-tokens")
    print("  检查Cookie: /check-cookie")
    print("  设置测试Cookie: /set-cookie")
    print("\n如果遇到数据库问题，可以使用以下命令重置数据库:")
    print("  python run.py --reset-db")
    print("\n按 Ctrl+C 停止服务器")
    app.run(host='0.0.0.0', port=5000, debug=True)