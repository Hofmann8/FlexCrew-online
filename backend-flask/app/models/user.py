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
    # 邮箱验证相关字段
    email_verified = db.Column(db.Boolean, default=False)
    email_verify_code = db.Column(db.String(6), nullable=True)
    email_verify_code_expires = db.Column(db.DateTime, nullable=True)
    
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
    
    def is_admin(self):
        """判断用户是否为管理员"""
        return self.role == 'admin'
    
    def is_leader(self):
        """判断用户是否为舞种领队"""
        return self.role == 'leader'
    
    def can_book_course(self):
        """判断用户是否有权限预约课程"""
        return True  # 所有用户默认都可以预约课程
    
    def requires_email_verification(self):
        """判断用户是否需要邮箱验证"""
        return self.role == 'member'
        
    def to_dict(self):
        """转换为字典"""
        data = {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'canBookCourse': self.can_book_course(),
            'danceType': self.dance_type,  # 总是返回舞种信息，无论是否为领队
            'emailVerified': self.email_verified
        }
        
        return data
    
    def __repr__(self):
        return f'<User {self.username}>' 