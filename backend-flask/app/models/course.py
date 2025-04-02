from app import db
from datetime import datetime, timedelta, date

class Course(db.Model):
    """课程模型"""
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    instructor = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    course_date = db.Column(db.Date, nullable=False)  # 课程日期
    time_slot = db.Column(db.String(20), nullable=False)  # 时间段
    max_capacity = db.Column(db.Integer, default=20)
    description = db.Column(db.Text, nullable=True)
    # 课程归属: 为空表示公共课程，否则是某个舞种的专属课程（对应领队的dance_type）
    dance_type = db.Column(db.String(50), nullable=True)
    # 添加领队ID，用于关联归属的领队
    leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    bookings = db.relationship('Booking', backref='course', lazy=True, cascade='all, delete-orphan')
    leader = db.relationship('User', backref='courses')
    
    def to_dict(self):
        """转换为字典"""
        # 获取预约此课程的用户ID列表
        booked_users = [booking.user_id for booking in self.bookings if booking.status == 'confirmed']
        
        # 计算已预约人数（只计算状态为confirmed的预约）
        booked_count = len(booked_users)
        
        data = {
            'id': self.id,
            'name': self.name,
            'instructor': self.instructor,
            'location': self.location,
            'courseDate': self.course_date.isoformat() if self.course_date else None,
            'weekday': self.get_weekday_name() if self.course_date else None,
            'timeSlot': self.time_slot,
            'maxCapacity': self.max_capacity,
            'bookedBy': booked_users,
            'bookedCount': booked_count,
            'currentBookings': booked_count,  # 兼容字段
            'description': self.description or '',
            'danceType': self.dance_type if self.dance_type else 'public',
            'leaderId': self.leader_id,
            'createdAt': self.created_at.isoformat() + 'Z'
        }
        
        return data
    
    def get_weekday_name(self):
        """获取课程日期对应的星期几名称"""
        if not self.course_date:
            return None
            
        weekday_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        return weekday_names[self.course_date.weekday()]
    
    @classmethod
    def check_time_conflict(cls, course_date, time_slot, location, exclude_course_id=None):
        """检查课程时间和地点是否有冲突
        
        Args:
            course_date: 课程日期，date类型
            time_slot: 时间段，字符串，格式如 "18:00-19:30"
            location: 上课地点
            exclude_course_id: 排除的课程ID（用于编辑课程时排除自身）
            
        Returns:
            冲突的课程列表，如果没有冲突则返回空列表
            如果时间格式无效或不合理，返回包含错误信息的字典列表
        """
        # 解析时间段
        try:
            start_time_str, end_time_str = time_slot.split('-')
            # 为了简化比较，我们只关心小时和分钟
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
            
            # 检查时间段是否合理
            # 1. 结束时间必须晚于开始时间（不允许跨夜）
            if end_time <= start_time:
                return [{'error': '时间段不合理：结束时间必须晚于开始时间'}]
            
            # 2. 课程时长不应过长（超过4小时）或过短（少于30分钟）
            start_datetime = datetime.combine(date.today(), start_time)
            end_datetime = datetime.combine(date.today(), end_time)
            duration = (end_datetime - start_datetime).total_seconds() / 60  # 转换为分钟
            
            if duration > 240:  # 4小时 = 240分钟
                return [{'error': f'课程时长过长（{int(duration)}分钟）：课程不应超过4小时'}]
            
            if duration < 30:
                return [{'error': f'课程时长过短（{int(duration)}分钟）：课程不应少于30分钟'}]
            
        except (ValueError, AttributeError):
            # 如果时间格式无法解析，为安全起见，认为有冲突
            return [{'error': '时间格式无效，请使用HH:MM-HH:MM格式'}]
        
        # 查询同一日期、同一地点的所有课程
        query = cls.query.filter(
            cls.course_date == course_date,
            cls.location == location
        )
        
        # 排除当前编辑的课程
        if exclude_course_id:
            query = query.filter(cls.id != exclude_course_id)
        
        # 获取所有可能冲突的课程
        potential_conflicts = query.all()
        
        # 检查时间冲突
        conflicts = []
        for course in potential_conflicts:
            try:
                c_start_time_str, c_end_time_str = course.time_slot.split('-')
                c_start_time = datetime.strptime(c_start_time_str, '%H:%M').time()
                c_end_time = datetime.strptime(c_end_time_str, '%H:%M').time()
                
                # 检查时间段是否重叠
                # 两个时间段不重叠的条件是：一个结束时间早于另一个开始时间
                # 重叠的条件是：不满足不重叠的条件
                if not (end_time <= c_start_time or c_end_time <= start_time):
                    conflicts.append(course)
            except (ValueError, AttributeError):
                # 如果现有课程的时间格式无法解析，也认为有冲突
                conflicts.append(course)
        
        return conflicts
    
    @staticmethod
    def get_week_courses(target_date):
        """获取指定日期所在周的所有课程
        
        Args:
            target_date: 目标日期，date类型
            
        Returns:
            该周的所有课程，按日期排序
        """
        # 计算该周的起始日期（星期一）和结束日期（星期日）
        weekday = target_date.weekday()
        week_start = target_date - timedelta(days=weekday)  # 周一
        week_end = week_start + timedelta(days=6)  # 周日
        
        # 查询该日期范围内的所有课程
        return Course.query.filter(
            Course.course_date >= week_start,
            Course.course_date <= week_end
        ).order_by(Course.course_date, Course.time_slot).all()
    
    def __repr__(self):
        return f'<Course {self.name} on {self.course_date}>'


class Booking(db.Model):
    """预订模型"""
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    status = db.Column(db.String(20), default='confirmed')  # 状态: pending, confirmed, canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'courseId': self.course_id,
            'status': self.status,
            'createdAt': self.created_at.isoformat() + 'Z',
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Booking {self.id}>' 