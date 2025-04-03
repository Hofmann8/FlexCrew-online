from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

# 导入路由
from app.auth import routes 