from flask import Blueprint

api_bp = Blueprint('api', __name__)

# 导入API模块
from app.api import routes 