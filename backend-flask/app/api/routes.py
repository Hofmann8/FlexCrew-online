from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import api_bp
from app.models.course import Course, Booking
from app.models.user import User
from app import db
from sqlalchemy.exc import IntegrityError
import os
from datetime import datetime, date, timedelta
import sys

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
    """查询用户对特定课程的预订状态"""
    try:
        # 增强调试信息
        print("\n===== 获取预订状态调试信息 =====", file=sys.stderr)
        print(f"请求路径: {request.path}", file=sys.stderr)
        print(f"请求方法: {request.method}", file=sys.stderr)
        
        # 详细的请求头部信息
        print("请求头部详情:", file=sys.stderr)
        for key, value in request.headers.items():
            # 截断过长的值
            if key.lower() == 'authorization' and value:
                print(f"  {key}: {value[:15]}...(已截断)", file=sys.stderr)
            else:
                print(f"  {key}: {value}", file=sys.stderr)
                
        # 详细的Cookie信息
        print("Cookie详情:", file=sys.stderr)
        for key, value in request.cookies.items():
            if key == 'access_token_cookie' and value:
                print(f"  {key}: {value[:15]}...(已截断)", file=sys.stderr)
            else:
                print(f"  {key}: {value}", file=sys.stderr)
        
        # JWT验证详情
        from flask_jwt_extended import get_jwt
        try:
            jwt_data = get_jwt()
            print("JWT数据:", file=sys.stderr)
            print(f"  用户ID: {get_jwt_identity()}", file=sys.stderr)
            print(f"  JWT发布时间: {jwt_data.get('iat')}", file=sys.stderr)
            print(f"  JWT过期时间: {jwt_data.get('exp')}", file=sys.stderr)
            print(f"  JWT类型: {jwt_data.get('type')}", file=sys.stderr)
        except Exception as jwt_err:
            print(f"获取JWT数据失败: {str(jwt_err)}", file=sys.stderr)
        
        current_user_id = get_jwt_identity()
        print(f"JWT用户身份: {current_user_id}", file=sys.stderr)
        
        # 尝试从多种来源获取用户身份
        auth_header = request.headers.get('Authorization', '')
        if not current_user_id and auth_header.startswith('Bearer '):
            try:
                from flask_jwt_extended import decode_token
                token = auth_header[7:]  # 去掉'Bearer '前缀
                decoded = decode_token(token)
                alt_user_id = decoded.get('sub')
                print(f"从Authorization头解析用户ID: {alt_user_id}", file=sys.stderr)
                if not current_user_id:
                    current_user_id = alt_user_id
                    print(f"使用从Authorization头获取的用户ID: {current_user_id}", file=sys.stderr)
            except Exception as e:
                print(f"解析Authorization头失败: {str(e)}", file=sys.stderr)
                
        # 检查Cookie中的令牌
        if not current_user_id:
            jwt_cookie = request.cookies.get('access_token_cookie')
            if jwt_cookie:
                try:
                    from flask_jwt_extended import decode_token
                    decoded = decode_token(jwt_cookie)
                    cookie_user_id = decoded.get('sub')
                    print(f"从Cookie解析用户ID: {cookie_user_id}", file=sys.stderr)
                    current_user_id = cookie_user_id
                    print(f"使用从Cookie获取的用户ID: {current_user_id}", file=sys.stderr)
                except Exception as e:
                    print(f"解析Cookie令牌失败: {str(e)}", file=sys.stderr)
        
        user = User.query.get(current_user_id)
        
        if not user:
            print(f"用户不存在，ID: {current_user_id}", file=sys.stderr)
            print("============================\n", file=sys.stderr)
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
            
        # 查询用户对该课程的预订记录
        booking = Booking.query.filter_by(
            user_id=current_user_id,
            course_id=course_id
        ).first()
        
        course = Course.query.get(course_id)
        if not course:
            print(f"课程不存在，ID: {course_id}", file=sys.stderr)
            print("============================\n", file=sys.stderr)
            return jsonify({
                'success': False,
                'message': '课程不存在'
            }), 404
            
        # 如果未找到预订记录，返回未预订状态
        if not booking:
            print(f"未找到预订记录，用户ID: {current_user_id}, 课程ID: {course_id}", file=sys.stderr)
            print("============================\n", file=sys.stderr)
            return jsonify({
                'success': True,
                'data': {
                    'courseId': course_id,
                    'status': 'not_booked',
                    'courseName': course.name
                }
            }), 200
            
        # 构建响应数据
        response_data = {
            'courseId': course_id,
            'status': booking.status,
            'bookingId': booking.id,
            'courseName': course.name,
            'bookingTime': booking.created_at.isoformat()
        }
        
        print(f"找到预订记录: {response_data}", file=sys.stderr)
        print("============================\n", file=sys.stderr)
        return jsonify({
            'success': True,
            'data': response_data
        }), 200
        
    except Exception as e:
        print(f"获取预订状态出错: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("============================\n", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': f'获取预订状态失败: {str(e)}'
        }), 500

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
    
    # 获取基本课程信息
    course_data = course.to_dict()
    
    # 获取预约用户的详细信息
    booked_users = []
    for booking in course.bookings:
        if booking.status == 'confirmed':
            user = User.query.get(booking.user_id)
            if user:
                booked_users.append({
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'bookingTime': booking.created_at.isoformat() + 'Z'
                })
    
    # 用详细的预约用户信息替换简单的用户ID列表
    course_data['bookedBy'] = booked_users
    
    return jsonify({
        'success': True,
        'data': course_data
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

@api_bp.route('/schedule', methods=['GET'])
def get_weekly_schedule():
    """获取某一周的课程安排
    
    请求参数:
        date: 日期字符串，格式为YYYY-MM-DD，默认为当天
        
    返回:
        该周的所有课程，按日期分组
    """
    # 获取请求中的日期参数，默认为今天
    date_str = request.args.get('date', date.today().isoformat())
    
    try:
        # 解析日期
        target_date = date.fromisoformat(date_str)
        
        # 获取该周的所有课程
        week_courses = Course.get_week_courses(target_date)
        
        # 计算一周起始日和结束日
        weekday = target_date.weekday()
        week_start = target_date - timedelta(days=weekday)  # 周一
        week_end = week_start + timedelta(days=6)  # 周日
        
        # 按日期分组课程
        date_groups = {}
        for i in range(7):
            day = week_start + timedelta(days=i)
            date_groups[day.isoformat()] = []
        
        # 将课程分配到各天
        for course in week_courses:
            date_groups[course.course_date.isoformat()].append(course.to_dict())
        
        # 构建结果
        result = {
            'weekStart': week_start.isoformat(),
            'weekEnd': week_end.isoformat(),
            'schedule': [
                {
                    'date': date_key,
                    'courses': courses
                }
                for date_key, courses in date_groups.items()
            ]
        }
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except ValueError:
        return jsonify({
            'success': False,
            'message': '日期格式错误，请使用YYYY-MM-DD格式'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取课程安排失败: {str(e)}'
        }), 500

@api_bp.route('/admin/courses', methods=['POST'])
@jwt_required()
def create_course():
    """创建课程"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin() and not user.is_leader():
        return jsonify({
            'success': False,
            'message': '权限不足，您无权创建课程'
        }), 403
    
    # 获取请求数据
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'message': '请求数据为空'
        }), 400
    
    # 验证必填字段
    required_fields = ['name', 'instructor', 'location', 'courseDate', 'timeSlot']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'message': f'缺少必填字段: {field}'
            }), 400
    
    try:
        # 解析课程日期
        course_date = date.fromisoformat(data['courseDate'])
    except ValueError:
        return jsonify({
            'success': False,
            'message': '课程日期格式错误，请使用YYYY-MM-DD格式'
        }), 400
    
    # 检查时间冲突
    conflicts = Course.check_time_conflict(course_date, data['timeSlot'], data['location'])
    
    if conflicts:
        if isinstance(conflicts[0], dict) and 'error' in conflicts[0]:
            # 时间格式或有效性错误
            error_message = conflicts[0]['error']
            return jsonify({
                'success': False,
                'message': error_message
            }), 400
        else:
            # 存在时间冲突的课程
            conflict_courses = [f"{c.name}（{c.course_date.isoformat()} {c.time_slot}）" for c in conflicts]
            return jsonify({
                'success': False,
                'message': f'该地点和时间段已被其他课程占用: {", ".join(conflict_courses)}'
            }), 409

    # 创建课程实例
    new_course = Course(
        name=data['name'],
        instructor=data['instructor'],
        location=data['location'],
        course_date=course_date,
        time_slot=data['timeSlot'],
        description=data.get('description', '')
    )
    
    # 设置课程最大容量
    if 'maxCapacity' in data and data['maxCapacity']:
        try:
            new_course.max_capacity = int(data['maxCapacity'])
        except ValueError:
            return jsonify({
                'success': False,
                'message': '最大容量必须是数字'
            }), 400
    
    # 设置课程归属（舞种和领队）
    if user.is_admin():
        # 管理员可以设置任何舞种
        if 'danceType' in data and data['danceType']:
            new_course.dance_type = data['danceType']
        
        # 管理员可以直接指定领队
        if 'leaderId' in data and data['leaderId']:
            new_course.leader_id = data['leaderId']
            # 如果指定了领队，自动设置对应的舞种
            if data['leaderId']:
                leader = User.query.get(data['leaderId'])
                if leader and leader.dance_type:
                    new_course.dance_type = leader.dance_type
    else:
        # 领队只能创建自己舞种的课程
        new_course.dance_type = user.dance_type
        new_course.leader_id = user.id
    
    try:
        db.session.add(new_course)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': new_course.to_dict(),
            'message': '课程创建成功'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'创建课程失败: {str(e)}'
        }), 500

@api_bp.route('/admin/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """更新课程"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin() and not user.is_leader():
        return jsonify({
            'success': False,
            'message': '权限不足，您无权更新课程'
        }), 403
    
    # 获取课程
    course = Course.query.get(course_id)
    if not course:
        return jsonify({
            'success': False,
            'message': '课程不存在'
        }), 404
    
    # 检查权限 - 领队只能修改自己舞种的课程
    if not user.is_admin() and course.leader_id != user.id:
        return jsonify({
            'success': False,
            'message': '您只能修改自己创建的课程'
        }), 403
    
    # 获取请求数据
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'message': '请求数据为空'
        }), 400
    
    # 记录原始位置和时间，用于检查冲突
    original_location = course.location
    original_date = course.course_date
    original_time_slot = course.time_slot
    
    # 更新课程基本信息
    if 'name' in data:
        course.name = data['name']
    if 'instructor' in data:
        course.instructor = data['instructor']
    
    # 更新位置，时间相关信息（可能需要检查冲突）
    location_changed = False
    date_changed = False
    time_slot_changed = False
    
    if 'location' in data:
        location_changed = data['location'] != original_location
        course.location = data['location']
        
    if 'courseDate' in data:
        try:
            new_date = date.fromisoformat(data['courseDate'])
            date_changed = new_date != original_date
            course.course_date = new_date
        except ValueError:
            return jsonify({
                'success': False,
                'message': '课程日期格式错误，请使用YYYY-MM-DD格式'
            }), 400
            
    if 'timeSlot' in data:
        time_slot_changed = data['timeSlot'] != original_time_slot
        course.time_slot = data['timeSlot']
    
    # 如果位置、日期或时间段有变更，需要检查冲突
    if location_changed or date_changed or time_slot_changed:
        conflicts = Course.check_time_conflict(
            course.course_date, 
            course.time_slot, 
            course.location,
            exclude_course_id=course_id  # 排除当前课程自身
        )
        
        if conflicts:
            if isinstance(conflicts[0], dict) and 'error' in conflicts[0]:
                # 时间格式或有效性错误
                error_message = conflicts[0]['error']
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 400
            else:
                # 有时间冲突
                conflict_courses = [f"{c.name}（{c.course_date.isoformat()} {c.time_slot}）" for c in conflicts]
                return jsonify({
                    'success': False,
                    'message': f'该地点和时间段已被其他课程占用: {", ".join(conflict_courses)}'
                }), 409
    
    # 更新其他信息
    if 'maxCapacity' in data and data['maxCapacity']:
        course.max_capacity = data['maxCapacity']
    if 'description' in data:
        course.description = data['description']
    
    # 管理员可以更改归属
    if user.is_admin():
        if 'danceType' in data:
            course.dance_type = data['danceType']
        if 'leaderId' in data:
            course.leader_id = data['leaderId'] if data['leaderId'] else None
    
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
            'message': f'更新课程失败: {str(e)}'
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
    """创建新用户（仅管理员可创建用户）"""
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
    required_fields = ['username', 'name', 'email', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'缺少必要字段: {field}'
            }), 400
    
    # 验证角色
    valid_roles = ['admin', 'leader', 'member']
    if data['role'] not in valid_roles:
        return jsonify({
            'success': False,
            'message': f'无效的角色，有效值为: {", ".join(valid_roles)}'
        }), 400
    
    # 对于leader角色，必须指定舞种
    if data['role'] == 'leader' and ('dance_type' not in data or not data['dance_type']):
        return jsonify({
            'success': False,
            'message': '领队必须指定舞种类型'
        }), 400
    
    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'success': False,
            'message': '用户名已存在'
        }), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({
            'success': False,
            'message': '邮箱已存在'
        }), 409
    
    # 创建新用户
    new_user = User(
        username=data['username'],
        name=data['name'],
        email=data['email'],
        role=data['role'],
        dance_type=data.get('dance_type'),  # 对于非领队角色，舞种可以为空
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
            'message': '用户创建成功'
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
    
    # 获取目标用户
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    data = request.get_json()
    
    # 权限检查 - 普通用户只能修改自己的信息
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({
            'success': False,
            'message': '无权更新其他用户信息'
        }), 403
    
    # 验证角色 - 普通用户不能修改自己的角色
    if 'role' in data:
        if current_user.role != 'admin' and current_user_id == user_id:
            # 普通用户尝试修改自己的角色，忽略此参数
            pass
        else:
            # 管理员可以修改角色
            valid_roles = ['admin', 'leader', 'member']
            if data['role'] not in valid_roles:
                return jsonify({
                    'success': False,
                    'message': f'无效的角色，有效值为: {", ".join(valid_roles)}'
                }), 400
            
            # 对于领队，必须指定舞种
            if data['role'] == 'leader':
                # 兼容两种参数格式
                dance_type = data.get('dance_type') or data.get('danceType')
                if not dance_type:
                    return jsonify({
                        'success': False,
                        'message': '领队必须指定舞种类型'
                    }), 400
                target_user.role = data['role']
    
    # 更新舞种（允许任何角色设置舞种，包括普通成员）
    # 兼容两种参数格式
    dance_type = None
    if 'dance_type' in data:
        dance_type = data['dance_type']
    elif 'danceType' in data:
        dance_type = data['danceType']
    
    # 如果提供了舞种参数
    if dance_type is not None:
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
            'message': '用户信息更新成功'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'用户信息更新失败: {str(e)}'
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
    
    # 获取该舞种的所有用户，不限角色
    users = User.query.filter_by(dance_type=dance_type).all()
    
    # 构建详细的用户数据
    user_data = []
    for user in users:
        # 从用户的 to_dict 方法获取基本信息
        data = user.to_dict()
        # 添加注册时间
        data['created_at'] = user.created_at.isoformat() + 'Z'
        user_data.append(data)
    
    return jsonify({
        'success': True,
        'data': user_data
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

@api_bp.route('/bookings/user', methods=['GET'])
@jwt_required()
def get_user_booking_records():
    """获取当前登录用户的预约课程记录（包含完整课程信息）"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 获取用户所有预订（包括已取消的），按创建时间倒序排列
    bookings = Booking.query.filter_by(user_id=current_user_id).order_by(Booking.created_at.desc()).all()
    
    # 构建响应数据
    result = []
    for booking in bookings:
        # 获取课程信息
        course = Course.query.get(booking.course_id)
        if course:
            # 现在可以直接使用booking的to_dict方法，因为数据库已经有updated_at字段
            booking_data = booking.to_dict()
            
            course_data = course.to_dict()
            
            # 合并课程信息
            booking_data.update({
                'name': course_data['name'],
                'instructor': course_data['instructor'],
                'location': course_data['location'],
                'courseDate': course_data['courseDate'],
                'weekday': course_data['weekday'],
                'timeSlot': course_data['timeSlot'],
                'dance_type': course_data['danceType'],
                'danceType': course_data['danceType']
            })
            
            result.append(booking_data)
    
    return jsonify({
        'success': True,
        'data': result
    }), 200

@api_bp.route('/courses/recent/dance-type/<string:dance_type>', methods=['GET'])
@jwt_required()
def get_recent_courses_by_dance_type(dance_type):
    """获取特定舞种最近的课程记录及预约情况
    
    参数：
    - dance_type: 舞种类型
    - limit: 查询参数，可选，限制返回的课程数量，默认为10
    """
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # 检查用户权限
    if not current_user:
        return jsonify({
            'success': False,
            'message': '用户不存在'
        }), 404
    
    # 权限检查：管理员可查看任何舞种，领队只能查看自己的舞种
    if current_user.role != 'admin' and (current_user.role != 'leader' or current_user.dance_type != dance_type):
        return jsonify({
            'success': False,
            'message': '无权查看此舞种的课程'
        }), 403
    
    # 获取limit参数，默认为10
    try:
        limit = int(request.args.get('limit', 10))
        if limit <= 0:
            limit = 10
    except ValueError:
        limit = 10
    
    # 获取特定舞种最近的课程，按课程日期降序排序
    courses = Course.query.filter_by(dance_type=dance_type).order_by(Course.course_date.desc()).limit(limit).all()
    
    # 构建详细的课程数据，包括预约用户信息
    result = []
    for course in courses:
        # 获取基本课程信息
        course_data = course.to_dict()
        
        # 获取预约用户的详细信息
        booked_users = []
        for booking in course.bookings:
            if booking.status == 'confirmed':
                user = User.query.get(booking.user_id)
                if user:
                    booked_users.append({
                        'id': user.id,
                        'name': user.name,
                        'username': user.username,
                        'bookingTime': booking.created_at.isoformat() + 'Z'
                    })
        
        # 用详细的预约用户信息替换简单的用户ID列表
        course_data['bookedBy'] = booked_users
        result.append(course_data)
    
    return jsonify({
        'success': True,
        'data': result
    }), 200 