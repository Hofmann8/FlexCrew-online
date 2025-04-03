from app import db, bcrypt
from app.models.user import User
from app.models.course import Course, Booking
import traceback
import time
import os
from datetime import datetime, date, timedelta

def seed_data():
    """初始化数据库"""
    print("开始初始化数据...")
    
    try:
        # 确保表已创建
        db.create_all()
        
        # 等待数据库准备就绪
        time.sleep(1)
        
        # 清除已有数据
        try:
            print("清除已有数据...")
            Booking.query.delete()
            Course.query.delete()
            User.query.delete()
            db.session.commit()
        except Exception as e:
            print(f"清除数据出错，可能是表不存在: {str(e)}")
            db.session.rollback()
        
        # 从环境变量获取管理员信息
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_name = os.environ.get('ADMIN_NAME', '超级管理员')
        
        # 创建超级管理员用户 - 从环境变量读取账号信息
        print("创建超级管理员用户...")
        admin = User(
            username=admin_username,
            name=admin_name,
            email='admin@example.com',
            role='admin',
            email_verified=True  # 管理员默认已验证
        )
        admin.password = admin_password
        db.session.add(admin)
        
        # 创建舞种领队用户 - 从环境变量读取账号信息
        print("创建舞种领队用户...")
        
        # 所有领队使用相同的初始密码
        leader_password = os.environ.get('LEADER_PASSWORD', 'leader123')
        
        # 舞种列表
        dance_types = ['hiphop', 'breaking', 'locking', 'popping', 'jazz', 'waacking', 'urban']
        
        # 存储创建的领队用户，供后续创建课程使用
        leaders = {}
        
        # 为每个舞种创建领队
        for dance_type in dance_types:
            dance_type_upper = dance_type.upper()
            username = os.environ.get(f'LEADER_{dance_type_upper}_USERNAME', f'{dance_type}_leader')
            name = os.environ.get(f'LEADER_{dance_type_upper}_NAME', f'{dance_type.capitalize()}领队')
            email = os.environ.get(f'LEADER_{dance_type_upper}_EMAIL', f'{dance_type}_leader@example.com')
            
            leader = User(
                username=username,
                name=name,
                email=email,
                role='leader',
                dance_type=dance_type,
                email_verified=True  # 领队默认已验证
            )
            leader.password = leader_password
            db.session.add(leader)
            leaders[dance_type] = leader
        
        # 创建普通社员用户
        print("创建普通社员用户...")
        member1 = User(
            username='member1',
            name='社员一',
            email='member1@mail.dlut.edu.cn',
            role='member',
            email_verified=True  # 测试账号默认已验证
        )
        member1.password = 'member123'
        
        member2 = User(
            username='member2',
            name='社员二',
            email='member2@mail.dlut.edu.cn',
            role='member',
            email_verified=True  # 测试账号默认已验证
        )
        member2.password = 'member123'
        
        # 添加用户到数据库
        try:
            db.session.add(member1)
            db.session.add(member2)
            db.session.commit()
            print(f"成功创建了{2 + len(dance_types)}个用户")
        except Exception as e:
            db.session.rollback()
            print(f"创建用户失败: {str(e)}")
            traceback.print_exc()
            return
        
        # 生成未来两周的课程日期
        today = date.today()
        # 找到下一个星期一的日期
        days_until_monday = (7 - today.weekday()) % 7
        next_monday = today + timedelta(days=days_until_monday)
        
        # 创建课程
        print("创建课程...")
        courses = [
            Course(
                name='Breaking基础班',
                instructor=leaders['breaking'].name,
                location='文化中心B201',
                course_date=next_monday,  # 星期一
                time_slot='18:00-19:30',
                max_capacity=15,
                description='Breaking舞蹈基础教学，适合零基础学员。',
                dance_type='breaking',
                leader_id=leaders['breaking'].id
            ),
            Course(
                name='Popping进阶班',
                instructor=leaders['popping'].name,
                location='文化中心B202',
                course_date=next_monday + timedelta(days=1),  # 星期二
                time_slot='19:00-20:30',
                max_capacity=12,
                description='Popping舞蹈进阶教学，需要有基础。',
                dance_type='popping',
                leader_id=leaders['popping'].id
            ),
            Course(
                name='Hip-Hop入门班',
                instructor=leaders['hiphop'].name,
                location='文化中心B201',
                course_date=next_monday + timedelta(days=2),  # 星期三
                time_slot='18:00-19:30',
                max_capacity=20,
                description='Hip-Hop舞蹈入门教学，适合零基础学员。',
                dance_type='hiphop',
                leader_id=leaders['hiphop'].id
            ),
            Course(
                name='Locking基础班',
                instructor=leaders['locking'].name,
                location='文化中心B202',
                course_date=next_monday + timedelta(days=3),  # 星期四
                time_slot='19:00-20:30',
                max_capacity=15,
                description='Locking舞蹈基础教学，适合零基础学员。',
                dance_type='locking',
                leader_id=leaders['locking'].id
            ),
            Course(
                name='Jazz舞蹈班',
                instructor=leaders['jazz'].name,
                location='文化中心B201',
                course_date=next_monday + timedelta(days=4),  # 星期五
                time_slot='16:00-17:30',
                max_capacity=15,
                description='Jazz舞蹈基础教学，适合零基础学员。',
                dance_type='jazz',
                leader_id=leaders['jazz'].id
            ),
            Course(
                name='Waacking入门班',
                instructor=leaders['waacking'].name,
                location='文化中心B201',
                course_date=next_monday + timedelta(days=4),  # 星期五
                time_slot='18:00-19:30',
                max_capacity=15,
                description='Waacking舞蹈基础教学，适合零基础学员。',
                dance_type='waacking',
                leader_id=leaders['waacking'].id
            ),
            Course(
                name='Urban舞蹈班',
                instructor=leaders['urban'].name,
                location='文化中心B202',
                course_date=next_monday + timedelta(days=5),  # 星期六
                time_slot='14:00-15:30',
                max_capacity=15,
                description='Urban舞蹈基础教学，适合零基础学员。',
                dance_type='urban',
                leader_id=leaders['urban'].id
            ),
            Course(
                name='周末集训营',
                instructor='全体领队',
                location='大学体育馆',
                course_date=next_monday + timedelta(days=6),  # 星期日
                time_slot='14:00-17:00',
                max_capacity=30,
                description='周末密集训练，提高舞蹈技巧和表演能力。',
                # 周末集训营是公共课程，不属于特定舞种
                dance_type=None,
                leader_id=None
            ),
            # 添加下一周的课程
            Course(
                name='Breaking基础班',
                instructor=leaders['breaking'].name,
                location='文化中心B201',
                course_date=next_monday + timedelta(days=7),  # 下周一
                time_slot='18:00-19:30',
                max_capacity=15,
                description='Breaking舞蹈基础教学，适合零基础学员。',
                dance_type='breaking',
                leader_id=leaders['breaking'].id
            ),
            Course(
                name='Popping进阶班',
                instructor=leaders['popping'].name,
                location='文化中心B202',
                course_date=next_monday + timedelta(days=8),  # 下周二
                time_slot='19:00-20:30',
                max_capacity=12,
                description='Popping舞蹈进阶教学，需要有基础。',
                dance_type='popping',
                leader_id=leaders['popping'].id
            )
        ]
        
        try:
            for course in courses:
                db.session.add(course)
            db.session.commit()
            print(f"成功创建了{len(courses)}个课程")
        except Exception as e:
            db.session.rollback()
            print(f"创建课程失败: {str(e)}")
            traceback.print_exc()
            return
        
        # 创建预订（只有普通社员才能预约课程）
        print("创建预订...")
        try:
            booking1 = Booking(user_id=member1.id, course_id=courses[0].id, status='confirmed')
            booking2 = Booking(user_id=member1.id, course_id=courses[2].id, status='confirmed')
            booking3 = Booking(user_id=member2.id, course_id=courses[1].id, status='confirmed')
            booking4 = Booking(user_id=member2.id, course_id=courses[3].id, status='confirmed')
            
            db.session.add(booking1)
            db.session.add(booking2)
            db.session.add(booking3)
            db.session.add(booking4)
            db.session.commit()
            print("成功创建了4条预订记录")
        except Exception as e:
            db.session.rollback()
            print(f"创建预订失败: {str(e)}")
            traceback.print_exc()
            return
            
        print("数据初始化完成!")
    except Exception as e:
        print(f"初始化数据失败: {str(e)}")
        traceback.print_exc() 