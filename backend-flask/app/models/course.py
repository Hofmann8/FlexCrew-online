from app import db
from datetime import datetime

class Course(db.Model):
    """课程模型"""
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    instructor = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    weekday = db.Column(db.String(20), nullable=False)  # 星期几
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
        booked_users = [booking.user_id for booking in self.bookings]
        data = {
            'id': self.id,
            'name': self.name,
            'instructor': self.instructor,
            'location': self.location,
            'weekday': self.weekday,
            'timeSlot': self.time_slot,
            'maxCapacity': self.max_capacity,
            'bookedBy': booked_users,
            'description': self.description,
            'danceType': self.dance_type if self.dance_type else 'public'
        }
        
        if self.leader_id:
            data['leaderId'] = self.leader_id
            
        return data
    
    def __repr__(self):
        return f'<Course {self.name}>'


class Booking(db.Model):
    """预订模型"""
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    status = db.Column(db.String(20), default='confirmed')  # 状态: pending, confirmed, canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'courseId': self.course_id,
            'status': self.status,
            'createdAt': self.created_at.isoformat() + 'Z'
        }
    
    def __repr__(self):
        return f'<Booking {self.id}>' 