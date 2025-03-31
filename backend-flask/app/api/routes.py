from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import api_bp
from app.models.course import Course, Booking
from app.models.user import User
from app import db
from sqlalchemy.exc import IntegrityError

@api_bp.route('/info')
def info():
    """返回街舞社基本信息"""
    return jsonify({
        'name': '街舞社',
        'description': '致力于推广街舞文化和技术的社团',
        'established': '2020',
        'members': '50+',
        'location': '校园文化中心B201'
    })

# 用户相关接口
@api_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """获取当前用户信息"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
        
    return jsonify({
        'success': True,
        'data': user.to_dict()
    }), 200

@api_bp.route('/users/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """获取用户所有预订的课程"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 获取用户所有已确认状态的预订
    bookings = Booking.query.filter_by(user_id=current_user_id, status='confirmed').all()
    course_ids = [booking.course_id for booking in bookings]
    
    # 查询对应的课程
    booked_courses = Course.query.filter(Course.id.in_(course_ids)).all()
    
    return jsonify({
        'success': True,
        'data': [course.to_dict() for course in booked_courses]
    }), 200

@api_bp.route('/users/booking-status/<int:course_id>', methods=['GET'])
@jwt_required()
def get_booking_status(course_id):
    """获取当前用户对特定课程的预订状态"""
    current_user_id = get_jwt_identity()
    
    # 检查课程是否存在
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    # 查询预订记录
    booking = Booking.query.filter_by(
        user_id=current_user_id,
        course_id=course_id
    ).first()
    
    if not booking:
        return jsonify({
            'success': True,
            'data': {
                'courseId': course_id,
                'status': 'not_booked',  # 未预订
                'courseName': course.name
            }
        }), 200
    
    return jsonify({
        'success': True,
        'data': {
            'courseId': course_id,
            'status': booking.status,  # confirmed 或 canceled
            'bookingId': booking.id,
            'courseName': course.name,
            'bookingTime': booking.created_at.isoformat() + 'Z'
        }
    }), 200

# 课程相关接口
@api_bp.route('/courses', methods=['GET'])
def get_all_courses():
    """获取所有课程"""
    courses = Course.query.all()
    return jsonify({
        'success': True,
        'data': [course.to_dict() for course in courses]
    }), 200

@api_bp.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """获取单个课程详情"""
    course = Course.query.get(course_id)
    
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
        
    return jsonify({
        'success': True,
        'data': course.to_dict()
    }), 200

@api_bp.route('/courses/<int:course_id>/book', methods=['POST'])
@jwt_required()
def book_course(course_id):
    """预订课程"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 检查用户权限 - 只有普通社员才能预约课程
    if not user.can_book_course():
        return jsonify({
            'success': False,
            'message': '您的用户角色无权预约课程'
        }), 403
        
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    # 检查是否已有预约记录（任何状态）
    existing_booking = Booking.query.filter_by(
        user_id=current_user_id,
        course_id=course_id
    ).first()
    
    if existing_booking:
        if existing_booking.status == 'confirmed':
            # 已有确认状态的预约
            return jsonify({
                'success': False,
                'message': '您已预订此课程'
            }), 400
        elif existing_booking.status == 'canceled':
            # 已取消的预约，可以重新激活
            try:
                # 更新状态为已确认
                existing_booking.status = 'confirmed'
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'data': existing_booking.to_dict(),
                    'message': '重新预订成功'
                }), 200
            except Exception as e:
                db.session.rollback()
                return jsonify({
                    'success': False,
                    'message': f'重新预订失败: {str(e)}'
                }), 500
    
    # 检查课程是否已满
    current_bookings = Booking.query.filter_by(
        course_id=course_id,
        status='confirmed'
    ).count()
    
    if current_bookings >= course.max_capacity:
        return jsonify({
            'success': False,
            'message': '课程已满员'
        }), 400
    
    # 创建预订
    booking = Booking(
        user_id=current_user_id,
        course_id=course_id,
        status='confirmed'
    )
    
    try:
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': booking.to_dict(),
            'message': '预订成功'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'预订失败: {str(e)}'
        }), 500

@api_bp.route('/courses/<int:course_id>/cancel', methods=['DELETE'])
@jwt_required()
def cancel_booking(course_id):
    """取消预订"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 检查用户权限 - 只有普通社员才能取消预约
    if not user.can_book_course():
        return jsonify({
            'success': False,
            'message': '您的用户角色无权取消预约'
        }), 403
    
    # 查找预订记录（不指定状态，查找任何状态的预约）
    booking = Booking.query.filter_by(
        user_id=current_user_id,
        course_id=course_id
    ).first()
    
    if not booking:
        return jsonify({
            'success': False,
            'message': '未找到预订记录'
        }), 404
    
    # 如果预约已经是取消状态，直接返回成功
    if booking.status == 'canceled':
        return jsonify({
            'success': True,
            'message': '预订已经是取消状态'
        }), 200
    
    try:
        # 更新状态为取消
        booking.status = 'canceled'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '取消预订成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'取消预订失败: {str(e)}'
        }), 500

@api_bp.route('/leaders', methods=['GET'])
def get_all_leaders():
    """获取所有舞种领队"""
    leaders = User.query.filter_by(role='leader').all()
    return jsonify({
        'success': True,
        'data': [leader.to_dict() for leader in leaders]
    }), 200

@api_bp.route('/leaders/<string:dance_type>', methods=['GET'])
def get_leader_by_dance_type(dance_type):
    """根据舞种获取领队信息"""
    leader = User.query.filter_by(role='leader', dance_type=dance_type).first()
    
    if not leader:
        return jsonify({
            'success': False,
            'message': f'未找到{dance_type}舞种的领队'
        }), 404
        
    return jsonify({
        'success': True,
        'data': leader.to_dict()
    }), 200

# 用户管理接口（仅管理员可访问）
@api_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """获取所有用户（仅管理员可访问）"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not user or user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    users = User.query.all()
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users]
    }), 200

@api_bp.route('/users/role/<string:role>', methods=['GET'])
@jwt_required()
def get_users_by_role(role):
    """按角色获取用户（仅管理员可访问，或领队查看自己的舞种学员）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 只有管理员可以查看任何角色的用户
    if current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 验证角色参数
    valid_roles = ['admin', 'leader', 'member']
    if role not in valid_roles:
        return jsonify({
            'success': False,
            'message': f'无效的角色参数，有效值为: {", ".join(valid_roles)}'
        }), 400
    
    users = User.query.filter_by(role=role).all()
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users]
    }), 200 