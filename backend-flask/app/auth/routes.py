from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth import auth_bp
from app.models.user import User
from app import db
from app.utils.email import is_valid_dlut_email, generate_verification_code, get_verification_code_expiry, send_verification_email
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from flask import current_app

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册：只允许普通社员注册，必须使用大工邮箱并验证"""
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
        
        # 验证邮箱格式 - 必须是大工邮箱
        email = data['email']
        
        # 强制设置为普通社员，忽略请求中可能的role参数
        role = 'member'
        
        # 必须使用大工邮箱
        if not is_valid_dlut_email(email):
            return jsonify({
                'success': False,
                'message': '注册必须使用大连理工大学邮箱（mail@mail.dlut.edu.cn）'
            }), 400
            
        # 检查用户名和邮箱是否已存在
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'success': False,
                'message': '用户名已存在'
            }), 409
            
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'message': '该邮箱已被注册'
            }), 409
            
        # 生成验证码
        verification_code = generate_verification_code()
        expiry = get_verification_code_expiry()
        
        # 创建未验证用户（只能是普通社员）
        user = User(
            username=data['username'],
            name=data['name'],
            email=email,
            role='member',  # 强制设置为普通社员
            email_verified=False,
            email_verify_code=verification_code,
            email_verify_code_expires=expiry
        )
        user.password = data['password']  # 使用setter方法哈希密码
        
        # 保存到数据库
        db.session.add(user)
        db.session.commit()
        
        # 尝试发送验证码邮件
        try:
            send_success = send_verification_email(email, verification_code)
            
            if not send_success:
                current_app.logger.warning(f"验证码邮件发送失败，但用户已创建: {email}")
                return jsonify({
                    'success': True,
                    'data': {
                        'userId': user.id,
                        'email': user.email,
                        'emailVerified': False
                    },
                    'message': '注册成功，但验证码邮件发送失败，请使用重新发送验证码功能或联系管理员'
                }), 201
                
        except Exception as mail_error:
            current_app.logger.error(f"邮件发送时发生异常: {str(mail_error)}")
            # 邮件发送异常，但用户已创建成功
            return jsonify({
                'success': True,
                'data': {
                    'userId': user.id,
                    'email': user.email,
                    'emailVerified': False
                },
                'message': '注册成功，但验证码邮件发送失败，请使用重新发送验证码功能'
            }), 201
        
        # 邮件发送成功
        return jsonify({
            'success': True,
            'data': {
                'userId': user.id,
                'email': user.email,
                'emailVerified': False
            },
            'message': '注册成功，请查收验证码邮件'
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': '用户名或邮箱已存在'
        }), 409
    except Exception as e:
        # 更详细的错误日志
        current_app.logger.error(f"注册过程发生严重错误: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'注册失败: {str(e)}'
        }), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """验证邮箱验证码"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        if 'userId' not in data or 'code' not in data:
            return jsonify({
                'success': False,
                'message': '缺少必要参数：userId 或 code'
            }), 400
            
        user_id = data['userId']
        code = data['code']
        
        # 查询用户
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
            
        # 检查用户是否需要验证
        if not user.requires_email_verification():
            return jsonify({
                'success': True,
                'data': {
                    'user': user.to_dict(), 
                    'token': create_access_token(identity=user.id)
                },
                'message': '此用户无需邮箱验证'
            }), 200
            
        # 检查用户是否已验证
        if user.email_verified:
            return jsonify({
                'success': True,
                'message': '邮箱已验证'
            }), 200
            
        # 验证码验证
        if not user.email_verify_code or user.email_verify_code != code:
            return jsonify({
                'success': False,
                'message': '验证码错误'
            }), 400
            
        # 检查验证码是否过期
        if not user.email_verify_code_expires or user.email_verify_code_expires < datetime.utcnow():
            return jsonify({
                'success': False,
                'message': '验证码已过期，请重新获取'
            }), 400
            
        # 更新用户验证状态
        user.email_verified = True
        user.email_verify_code = None  # 清除验证码
        user.email_verify_code_expires = None
        
        db.session.commit()
        
        # 生成JWT令牌
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token
            },
            'message': '邮箱验证成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'验证失败: {str(e)}'
        }), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """重新发送验证码"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        if 'email' not in data:
            return jsonify({
                'success': False,
                'message': '缺少必要参数：email'
            }), 400
            
        email = data['email']
        
        # 查询用户
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                'success': False,
                'message': '该邮箱未注册'
            }), 404
            
        # 检查用户是否需要验证 
        if not user.requires_email_verification():
            return jsonify({
                'success': True,
                'data': {
                    'user': user.to_dict(),
                    'token': create_access_token(identity=user.id)
                },
                'message': '此用户无需邮箱验证'
            }), 200
            
        # 检查用户是否已验证
        if user.email_verified:
            return jsonify({
                'success': True,
                'message': '邮箱已验证，无需重新发送验证码'
            }), 200
            
        # 生成新验证码
        verification_code = generate_verification_code()
        expiry = get_verification_code_expiry()
        
        # 更新用户验证码
        user.email_verify_code = verification_code
        user.email_verify_code_expires = expiry
        
        db.session.commit()
        
        # 发送验证码邮件
        send_success = send_verification_email(email, verification_code)
        
        if not send_success:
            return jsonify({
                'success': False,
                'message': '验证码邮件发送失败，请稍后再试'
            }), 500
        
        return jsonify({
            'success': True,
            'data': {
                'userId': user.id,
                'email': user.email
            },
            'message': '验证码已重新发送，请查收邮件'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'发送失败: {str(e)}'
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
        
        # 仅普通社员需要验证邮箱
        if user.role == 'member' and not user.email_verified:
            return jsonify({
                'success': False,
                'data': {
                    'userId': user.id,
                    'email': user.email,
                    'emailVerified': False
                },
                'message': '邮箱尚未验证，请先完成邮箱验证'
            }), 403
            
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