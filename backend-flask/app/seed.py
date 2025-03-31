from app import db, bcrypt
from app.models.user import User
from app.models.course import Course, Booking
import traceback
import time

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
        
        # 创建超级管理员用户
        print("创建用户...")
        admin = User(
            username='admin',
            name='超级管理员',
            email='admin@example.com',
            role='admin'
        )
        admin.password = 'admin123'
        
        # 创建舞种领队用户
        leader1 = User(
            username='leader1',
            name='张领队',
            email='leader1@example.com',
            role='leader',
            dance_type='breaking'
        )
        leader1.password = 'leader123'
        
        leader2 = User(
            username='leader2',
            name='李领队',
            email='leader2@example.com',
            role='leader',
            dance_type='popping'
        )
        leader2.password = 'leader123'
        
        leader3 = User(
            username='leader3',
            name='王领队',
            email='leader3@example.com',
            role='leader',
            dance_type='hiphop'
        )
        leader3.password = 'leader123'
        
        leader4 = User(
            username='leader4',
            name='赵领队',
            email='leader4@example.com',
            role='leader',
            dance_type='locking'
        )
        leader4.password = 'leader123'
        
        # 创建普通社员用户
        member1 = User(
            username='member1',
            name='社员一',
            email='member1@example.com',
            role='member'
        )
        member1.password = 'member123'
        
        member2 = User(
            username='member2',
            name='社员二',
            email='member2@example.com',
            role='member'
        )
        member2.password = 'member123'
        
        # 添加用户到数据库
        try:
            db.session.add(admin)
            db.session.add(leader1)
            db.session.add(leader2)
            db.session.add(leader3)
            db.session.add(leader4)
            db.session.add(member1)
            db.session.add(member2)
            db.session.commit()
            print(f"成功创建了7个用户")
        except Exception as e:
            db.session.rollback()
            print(f"创建用户失败: {str(e)}")
            traceback.print_exc()
            return
        
        # 创建课程
        print("创建课程...")
        courses = [
            Course(
                name='Breaking基础班',
                instructor='张领队',
                location='文化中心B201',
                weekday='星期一',
                time_slot='18:00-19:30',
                max_capacity=15,
                description='Breaking舞蹈基础教学，适合零基础学员。'
            ),
            Course(
                name='Popping进阶班',
                instructor='李领队',
                location='文化中心B202',
                weekday='星期二',
                time_slot='19:00-20:30',
                max_capacity=12,
                description='Popping舞蹈进阶教学，需要有基础。'
            ),
            Course(
                name='Hip-Hop入门班',
                instructor='王领队',
                location='文化中心B201',
                weekday='星期三',
                time_slot='18:00-19:30',
                max_capacity=20,
                description='Hip-Hop舞蹈入门教学，适合零基础学员。'
            ),
            Course(
                name='Locking基础班',
                instructor='赵领队',
                location='文化中心B202',
                weekday='星期四',
                time_slot='19:00-20:30',
                max_capacity=15,
                description='Locking舞蹈基础教学，适合零基础学员。'
            ),
            Course(
                name='街舞混合风格班',
                instructor='张领队',
                location='文化中心B201',
                weekday='星期五',
                time_slot='18:00-20:00',
                max_capacity=20,
                description='混合多种街舞风格的综合课程，适合有一定基础的学员。'
            ),
            Course(
                name='周末集训营',
                instructor='李领队',
                location='大学体育馆',
                weekday='星期六',
                time_slot='14:00-17:00',
                max_capacity=30,
                description='周末密集训练，提高舞蹈技巧和表演能力。'
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
            print(f"成功创建了4个预订")
        except Exception as e:
            db.session.rollback()
            print(f"创建预订失败: {str(e)}")
            traceback.print_exc()
            return
        
        print("数据初始化完成！")
    
    except Exception as e:
        db.session.rollback()
        print(f"数据初始化失败: {str(e)}")
        traceback.print_exc() 