from app import db, bcrypt
from datetime import datetime

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    # 角色: admin(超级管理员), leader(舞种领队), member(普通社员)
    role = db.Column(db.String(20), default='member')
    # 舞种: breaking, popping, hiphop, locking等，仅对leader角色有意义
    dance_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    bookings = db.relationship('Booking', backref='user', lazy=True, cascade='all, delete-orphan')
    
    @property
    def password(self):
        """防止直接访问密码"""
        raise AttributeError('password不是可读属性')
        
    @password.setter
    def password(self, password):
        """设置密码哈希"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    def verify_password(self, password):
        """验证密码"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def can_book_course(self):
        """判断用户是否有权限预约课程"""
        return self.role == 'member'
        
    def to_dict(self):
        """转换为字典"""
        data = {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'canBookCourse': self.can_book_course()
        }
        
        # 如果是领队，添加舞种信息
        if self.role == 'leader' and self.dance_type:
            data['danceType'] = self.dance_type
            
        return data
    
    def __repr__(self):
        return f'<User {self.username}>' 