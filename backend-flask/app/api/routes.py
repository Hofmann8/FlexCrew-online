from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import api_bp
from app.models.course import Course, Booking
from app.models.user import User
from app import db
from sqlalchemy.exc import IntegrityError
import os

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

# 课程管理接口（仅超级管理员和舞种领队可访问）
@api_bp.route('/admin/courses', methods=['GET'])
@jwt_required()
def get_admin_courses():
    """获取课程（管理员可查看所有课程，领队只能查看自己舞种的课程）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or (current_user.role != 'admin' and current_user.role != 'leader'):
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 管理员可查看所有课程
    if current_user.role == 'admin':
        courses = Course.query.all()
    # 领队只能查看自己舞种的课程和公共课程
    else:
        courses = Course.query.filter(
            (Course.dance_type == current_user.dance_type) | 
            (Course.leader_id == current_user_id) |
            (Course.dance_type.is_(None))
        ).all()
    
    return jsonify({
        'success': True,
        'data': [course.to_dict() for course in courses]
    }), 200

@api_bp.route('/admin/courses', methods=['POST'])
@jwt_required()
def create_course():
    """创建课程（管理员可创建任何课程，领队只能创建自己舞种的课程）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or (current_user.role != 'admin' and current_user.role != 'leader'):
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    data = request.get_json()
    
    # 验证必要字段
    required_fields = ['name', 'instructor', 'location', 'weekday', 'timeSlot']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'缺少必要字段: {field}'
            }), 400
    
    # 处理课程归属（舞种）
    dance_type = data.get('danceType')
    leader_id = data.get('leaderId')
    
    # 如果是领队，只能创建自己舞种的课程
    if current_user.role == 'leader':
        dance_type = current_user.dance_type
        leader_id = current_user_id
    
    # 创建课程
    course = Course(
        name=data['name'],
        instructor=data['instructor'],
        location=data['location'],
        weekday=data['weekday'],
        time_slot=data['timeSlot'],
        max_capacity=data.get('maxCapacity', 20),
        description=data.get('description', ''),
        dance_type=dance_type,
        leader_id=leader_id
    )
    
    try:
        db.session.add(course)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': course.to_dict(),
            'message': '课程创建成功'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'课程创建失败: {str(e)}'
        }), 500

@api_bp.route('/admin/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """更新课程信息（管理员可更新任何课程，领队只能更新自己舞种的课程）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or (current_user.role != 'admin' and current_user.role != 'leader'):
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 获取要更新的课程
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    # 领队只能更新自己舞种的课程
    if current_user.role == 'leader' and (course.dance_type != current_user.dance_type and course.leader_id != current_user_id):
        return jsonify({
            'success': False,
            'message': '您只能修改自己舞种的课程'
        }), 403
    
    data = request.get_json()
    
    # 更新课程信息
    if 'name' in data:
        course.name = data['name']
    if 'instructor' in data:
        course.instructor = data['instructor']
    if 'location' in data:
        course.location = data['location']
    if 'weekday' in data:
        course.weekday = data['weekday']
    if 'timeSlot' in data:
        course.time_slot = data['timeSlot']
    if 'maxCapacity' in data:
        course.max_capacity = data['maxCapacity']
    if 'description' in data:
        course.description = data['description']
    
    # 只有管理员可以修改课程归属
    if current_user.role == 'admin':
        if 'danceType' in data:
            course.dance_type = data['danceType']
        if 'leaderId' in data:
            course.leader_id = data['leaderId']
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': course.to_dict(),
            'message': '课程更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'课程更新失败: {str(e)}'
        }), 500

@api_bp.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    """删除课程（管理员可删除任何课程，领队只能删除自己舞种的课程）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or (current_user.role != 'admin' and current_user.role != 'leader'):
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 获取要删除的课程
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    # 领队只能删除自己舞种的课程
    if current_user.role == 'leader' and (course.dance_type != current_user.dance_type and course.leader_id != current_user_id):
        return jsonify({
            'success': False,
            'message': '您只能删除自己舞种的课程'
        }), 403
    
    try:
        # 删除课程前先删除所有相关预订
        Booking.query.filter_by(course_id=course_id).delete()
        
        # 删除课程
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '课程删除成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'课程删除失败: {str(e)}'
        }), 500

@api_bp.route('/admin/courses/assignments', methods=['GET'])
@jwt_required()
def get_course_assignments():
    """获取课程分配情况（仅管理员可访问）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 获取所有课程和领队
    leaders = User.query.filter_by(role='leader').all()
    
    # 统计每个舞种的课程数
    result = []
    for leader in leaders:
        # 该领队的课程数
        course_count = Course.query.filter(
            (Course.dance_type == leader.dance_type) | 
            (Course.leader_id == leader.id)
        ).count()
        
        result.append({
            'leaderId': leader.id,
            'leaderName': leader.name,
            'danceType': leader.dance_type,
            'courseCount': course_count
        })
    
    # 公共课程数
    public_count = Course.query.filter(Course.dance_type.is_(None), Course.leader_id.is_(None)).count()
    result.append({
        'danceType': 'public',
        'courseCount': public_count
    })
    
    return jsonify({
        'success': True,
        'data': result
    }), 200

@api_bp.route('/admin/courses/<int:course_id>/assign', methods=['PUT'])
@jwt_required()
def assign_course(course_id):
    """分配课程归属（仅管理员可访问）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权访问此接口'
        }), 403
    
    # 获取要分配的课程
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    data = request.get_json()
    
    # 验证参数
    if 'danceType' not in data and 'leaderId' not in data:
        return jsonify({
            'success': False,
            'message': '缺少必要参数: danceType 或 leaderId'
        }), 400
    
    # 如果是分配给公共课程
    if data.get('danceType') == 'public' or data.get('leaderId') == 0:
        course.dance_type = None
        course.leader_id = None
    else:
        # 如果提供了领队ID，根据领队ID设置舞种
        if 'leaderId' in data and data['leaderId']:
            leader = User.query.filter_by(id=data['leaderId'], role='leader').first()
            if not leader:
                return jsonify({
                    'success': False,
                    'message': '领队不存在或用户不是领队角色'
                }), 404
            
            course.leader_id = leader.id
            course.dance_type = leader.dance_type
        # 如果只提供了舞种，查找对应舞种的领队
        elif 'danceType' in data and data['danceType']:
            leader = User.query.filter_by(dance_type=data['danceType'], role='leader').first()
            if not leader:
                return jsonify({
                    'success': False,
                    'message': f'未找到{data["danceType"]}舞种的领队'
                }), 404
            
            course.leader_id = leader.id
            course.dance_type = data['danceType']
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': course.to_dict(),
            'message': '课程归属分配成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'课程归属分配失败: {str(e)}'
        }), 500

# 用户管理模块（新增接口）
@api_bp.route('/users/profile', methods=['PATCH'])
@jwt_required()
def update_user_profile():
    """更新用户资料（用户可更新自己的资料，管理员可更新任何用户）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    data = request.get_json()
    target_user_id = data.get('userId', current_user_id)
    
    # 如果不是管理员且尝试修改其他用户，则拒绝
    if current_user.role != 'admin' and int(target_user_id) != current_user_id:
        return jsonify({
            'success': False,
            'message': '无权修改其他用户资料'
        }), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '目标用户不存在'
        }), 404
    
    # 更新基本资料
    if 'name' in data:
        target_user.name = data['name']
    if 'email' in data:
        # 检查邮箱是否已存在
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != target_user.id:
            return jsonify({
                'success': False,
                'message': '该邮箱已被其他用户使用'
            }), 409
        target_user.email = data['email']
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': target_user.to_dict(),
            'message': '用户资料更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'资料更新失败: {str(e)}'
        }), 500

@api_bp.route('/users/password', methods=['PATCH'])
@jwt_required()
def update_user_password():
    """更新用户密码（用户只能更改自己的密码，管理员可以更改任何用户密码）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    data = request.get_json()
    target_user_id = data.get('userId', current_user_id)
    
    # 非管理员且尝试修改其他用户密码，则拒绝
    if current_user.role != 'admin' and int(target_user_id) != current_user_id:
        return jsonify({
            'success': False,
            'message': '无权修改其他用户密码'
        }), 403
    
    # 获取目标用户
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '目标用户不存在'
        }), 404
    
    # 普通用户修改自己密码时，需要验证当前密码
    if current_user.role != 'admin' and current_user_id == target_user_id:
        if 'currentPassword' not in data:
            return jsonify({
                'success': False,
                'message': '请提供当前密码'
            }), 400
        
        if not target_user.verify_password(data['currentPassword']):
            return jsonify({
                'success': False,
                'message': '当前密码错误'
            }), 401
    
    # 验证新密码
    if 'newPassword' not in data:
        return jsonify({
            'success': False,
            'message': '请提供新密码'
        }), 400
    
    if len(data['newPassword']) < 6:
        return jsonify({
            'success': False,
            'message': '密码长度不能少于6个字符'
        }), 400
    
    # 更新密码
    target_user.password = data['newPassword']
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '密码更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'密码更新失败: {str(e)}'
        }), 500

@api_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """创建新用户（仅管理员可创建领队用户）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查权限
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权创建用户'
        }), 403
    
    data = request.get_json()
    
    # 验证必要字段
    required_fields = ['username', 'name', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'缺少必要字段: {field}'
            }), 400
    
    # 验证角色 - 管理员只能创建领队用户，普通社员通过注册流程创建
    if data['role'] != 'leader':
        return jsonify({
            'success': False,
            'message': '管理员只能创建领队用户，普通社员需要通过注册流程'
        }), 400
    
    # 领队必须指定舞种
    if 'dance_type' not in data or not data['dance_type']:
        return jsonify({
            'success': False,
            'message': '领队必须指定舞种类型'
        }), 400
    
    # 创建邮箱 - 对于领队可以使用任何邮箱
    email = data.get('email')
    if not email:
        # 为领队生成一个系统邮箱，格式为 username@example.com
        email = f"{data['username']}@example.com"
    
    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'success': False,
            'message': '用户名已存在'
        }), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'message': '邮箱已存在'
        }), 409
    
    # 创建新用户
    new_user = User(
        username=data['username'],
        name=data['name'],
        email=email,
        role=data['role'],
        dance_type=data['dance_type'],
        # 管理员创建的用户默认已验证
        email_verified=True
    )
    new_user.password = data['password']
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_user.to_dict(),
            'message': '领队用户创建成功'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'用户创建失败: {str(e)}'
        }), 500

@api_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    """更新用户角色和舞种（仅管理员）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查权限
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权更新用户角色'
        }), 403
    
    # 获取目标用户
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    data = request.get_json()
    
    # 验证角色
    if 'role' not in data:
        return jsonify({
            'success': False,
            'message': '缺少必要字段: role'
        }), 400
    
    valid_roles = ['admin', 'leader', 'member']
    if data['role'] not in valid_roles:
        return jsonify({
            'success': False,
            'message': f'无效的角色，有效值为: {", ".join(valid_roles)}'
        }), 400
    
    # 对于领队，必须指定舞种
    if data['role'] == 'leader' and ('dance_type' not in data or not data['dance_type']):
        return jsonify({
            'success': False,
            'message': '领队必须指定舞种类型'
        }), 400
    
    # 更新角色
    target_user.role = data['role']
    
    # 更新舞种（允许任何角色设置舞种，包括普通成员）
    if 'dance_type' in data:
        dance_type = data['dance_type']
        # 如果舞种为"null"或空字符串，则将舞种设为None
        if dance_type == "null" or dance_type == "":
            target_user.dance_type = None
        else:
            target_user.dance_type = dance_type
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': target_user.to_dict(),
            'message': '用户角色更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'用户角色更新失败: {str(e)}'
        }), 500

@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """删除用户（仅管理员）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查权限
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '无权删除用户'
        }), 403
    
    # 不能删除自己
    if user_id == current_user_id:
        return jsonify({
            'success': False,
            'message': '不能删除当前登录的用户'
        }), 400
    
    # 获取目标用户
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    try:
        # 先删除用户关联的预订
        Booking.query.filter_by(user_id=user_id).delete()
        
        # 如果是领队，需要处理其负责的课程
        if target_user.role == 'leader':
            # 将该领队的课程重置为公共课程（可选：或者删除这些课程）
            Course.query.filter_by(leader_id=user_id).update({
                'leader_id': None,
                'dance_type': None
            })
        
        # 删除用户
        db.session.delete(target_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '用户删除成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'用户删除失败: {str(e)}'
        }), 500

@api_bp.route('/users/dance-type/<string:dance_type>', methods=['GET'])
@jwt_required()
def get_users_by_dance_type(dance_type):
    """获取特定舞种的所有成员（管理员和对应舞种领队可访问）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 权限检查：管理员可查看任何舞种，领队只能查看自己的舞种
    if current_user.role != 'admin' and (current_user.role != 'leader' or current_user.dance_type != dance_type):
        return jsonify({
            'success': False,
            'message': '无权查看此舞种的成员'
        }), 403
    
    # 获取该舞种的所有成员（仅限member角色）
    members = User.query.filter_by(role='member', dance_type=dance_type).all()
    
    return jsonify({
        'success': True,
        'data': [member.to_dict() for member in members]
    }), 200

@api_bp.route('/users/<int:user_id>/dance-type', methods=['PUT'])
@jwt_required()
def update_user_dance_type(user_id):
    """更新用户舞种（管理员可更新任何用户，领队只能更新自己舞种的成员）"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 获取目标用户
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '目标用户不存在'
        }), 404
    
    data = request.get_json()
    
    # 验证舞种参数
    if 'danceType' not in data:
        return jsonify({
            'success': False,
            'message': '缺少必要字段: danceType'
        }), 400
    
    # 权限检查:
    # 1. 管理员可以更新任何用户的舞种
    # 2. 领队只能将普通成员分配到自己的舞种
    if current_user.role != 'admin':
        if current_user.role != 'leader':
            return jsonify({
                'success': False,
                'message': '无权更新用户舞种'
            }), 403
        
        # 领队只能更新普通成员的舞种，且只能分配到自己的舞种
        if target_user.role != 'member':
            return jsonify({
                'success': False,
                'message': '领队只能更新普通成员的舞种'
            }), 403
        
        # 领队只能将成员分配到自己的舞种
        if data['danceType'] != current_user.dance_type:
            return jsonify({
                'success': False,
                'message': '领队只能将成员分配到自己的舞种'
            }), 403
    
    # 更新用户舞种
    dance_type = data['danceType']
    # 如果舞种为"null"或空字符串，则将舞种设为None
    if dance_type == "null" or dance_type == "":
        target_user.dance_type = None
    else:
        target_user.dance_type = dance_type
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': target_user.to_dict(),
            'message': '用户舞种更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'用户舞种更新失败: {str(e)}'
        }), 500

# 系统管理相关接口
@api_bp.route('/admin/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    """获取系统日志，仅管理员可访问"""
    # 获取当前用户ID
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 验证是否为管理员
    if not current_user or current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': '仅管理员可访问系统日志'
        }), 403
    
    # 日志文件路径，根据实际设置修改
    log_lines = []
    log_file = os.path.join("logs", "flask.log")
    
    try:
        # 如果日志文件存在，读取最后100行
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as file:
                all_lines = file.readlines()
                log_lines = all_lines[-100:] if len(all_lines) > 100 else all_lines
        else:
            # 尝试列出可能的日志位置
            possible_logs = []
            log_dirs = ["logs", "log", ".", "instance"]
            for log_dir in log_dirs:
                if os.path.exists(log_dir):
                    for file in os.listdir(log_dir):
                        if file.endswith(".log"):
                            possible_logs.append(os.path.join(log_dir, file))
            
            return jsonify({
                'success': False,
                'message': f'未找到日志文件。可能的日志位置：{possible_logs}'
            }), 404
    
        return jsonify({
            'success': True,
            'data': {
                'logs': log_lines,
                'file': log_file
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'读取日志失败: {str(e)}'
        }), 500 