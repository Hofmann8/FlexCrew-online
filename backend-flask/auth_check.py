#!/usr/bin/env python
import sys
import json
from flask import jsonify, request, Blueprint

def create_auth_debug_bp():
    """创建认证调试蓝图"""
    auth_debug_bp = Blueprint('auth_debug', __name__)
    
    @auth_debug_bp.route('/auth-debug', methods=['GET'])
    def auth_debug():
        """检查请求头和Cookie"""
        headers = {k: v for k, v in request.headers.items()}
        cookies = {k: v for k, v in request.cookies.items()}
        
        # 检查Authorization头部
        auth_header = headers.get('Authorization', '')
        token_type = None
        token_value = None
        
        if auth_header.startswith('Bearer '):
            token_type = 'Bearer'
            token_value = auth_header[7:]  # 去掉'Bearer '前缀
        
        # 检查JWT Cookie
        jwt_cookie = cookies.get('access_token_cookie', None)
        
        result = {
            'server_info': {
                'host': request.host,
                'remote_addr': request.remote_addr,
                'scheme': request.scheme,
                'endpoint': request.endpoint,
                'method': request.method,
                'origin': request.origin if hasattr(request, 'origin') else None,
            },
            'headers': headers,
            'cookies': cookies,
            'auth_check': {
                'has_auth_header': bool(auth_header),
                'auth_header_type': token_type,
                'auth_token_present': bool(token_value),
                'has_jwt_cookie': bool(jwt_cookie),
                'auth_problems': []
            }
        }
        
        # 检查可能的问题
        problems = result['auth_check']['auth_problems']
        
        if not token_value and not jwt_cookie:
            problems.append('未找到任何认证令牌（无Bearer令牌和JWT Cookie）')
        
        if not token_value and jwt_cookie:
            problems.append('只有JWT Cookie但没有Bearer令牌，某些端点可能需要Bearer令牌')
            
        if token_value and not jwt_cookie:
            problems.append('只有Bearer令牌但没有JWT Cookie，刷新功能可能无法正常工作')
        
        if jwt_cookie and token_value and jwt_cookie != token_value:
            problems.append('Bearer令牌和JWT Cookie不一致，可能导致认证问题')
        
        cors_headers = {
            'Access-Control-Allow-Origin': headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Credentials': headers.get('Access-Control-Allow-Credentials'),
            'Access-Control-Allow-Methods': headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': headers.get('Access-Control-Allow-Headers'),
        }
        
        if 'Origin' in headers and 'Access-Control-Allow-Origin' not in headers:
            problems.append('请求包含Origin但响应中缺少CORS头部，可能存在跨域问题')
        
        if headers.get('Access-Control-Allow-Credentials') != 'true':
            problems.append('Access-Control-Allow-Credentials未设置为true，跨域Cookie传输可能受限')
        
        # 添加解决建议
        if problems:
            result['solutions'] = [
                "前端请确保使用 credentials: 'include' 选项发送请求",
                "确保前端在发起请求时设置了 Authorization: Bearer {token} 头部",
                "尝试使用/api/auth/auto-refresh端点刷新JWT Cookie"
            ]
        else:
            result['auth_check']['status'] = '认证配置看起来正常'
        
        return jsonify(result)
    
    @auth_debug_bp.route('/test-token-mismatch', methods=['GET'])
    def test_token_mismatch():
        """测试Bearer令牌与Cookie不匹配的情况"""
        from flask_jwt_extended import create_access_token, set_access_cookies
        
        # 创建两个不同的令牌
        token1 = create_access_token(identity=str(998))
        token2 = create_access_token(identity=str(999))
        
        response = jsonify({
            'success': True,
            'message': '已设置不同的Bearer令牌和Cookie令牌用于测试',
            'bearer_token': token1,
            'cookie_token': token2
        })
        
        # 在Cookie中设置token2
        set_access_cookies(response, token2)
        
        return response
    
    @auth_debug_bp.route('/fix-token-sync', methods=['GET'])
    def fix_token_sync():
        """修复令牌同步问题"""
        from flask_jwt_extended import get_jwt_identity, create_access_token, set_access_cookies
        
        # 尝试获取当前用户身份
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return jsonify({
                'success': False,
                'message': '未检测到有效令牌，无法修复同步问题'
            }), 401
            
        # 创建新令牌
        new_token = create_access_token(identity=str(current_user_id))
        
        # 创建响应
        response = jsonify({
            'success': True,
            'message': '令牌已同步',
            'token': new_token
        })
        
        # 设置Cookie
        set_access_cookies(response, new_token)
        
        return response
    
    return auth_debug_bp

def register_auth_debug(app):
    """注册认证调试蓝图"""
    auth_debug_bp = create_auth_debug_bp()
    app.register_blueprint(auth_debug_bp)
    
    return auth_debug_bp 