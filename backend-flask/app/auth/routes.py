from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth import auth_bp
from app.models.user import User
from app import db
from sqlalchemy.exc import IntegrityError

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['username', 'name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必填字段: {field}'
                }), 400
            
        # 创建新用户
        user = User(
            username=data['username'],
            name=data['name'],
            email=data['email'],
            role='student'  # 默认角色为学生
        )
        user.password = data['password']  # 使用setter方法哈希密码
        
        # 保存到数据库
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict()
            },
            'message': '注册成功'
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '用户名或邮箱已存在'
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'注册失败: {str(e)}'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        if 'username' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': '请提供用户名和密码'
            }), 400
            
        # 查询用户
        user = User.query.filter_by(username=data['username']).first()
        
        # 验证用户和密码
        if not user or not user.verify_password(data['password']):
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
            
        # 创建访问令牌
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'登录失败: {str(e)}'
        }), 500 