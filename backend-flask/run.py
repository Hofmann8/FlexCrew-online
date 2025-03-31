from app import create_app, db
import os
import sys

app = create_app()

def reset_database():
    """重置数据库，删除现有数据库文件并重新创建"""
    print("正在重置数据库...")
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    
    # 检查数据库文件是否存在
    if os.path.exists(db_path):
        print(f"删除旧数据库文件: {db_path}")
        os.remove(db_path)
    
    # 重新初始化应用
    with app.app_context():
        db.create_all()
        from app.seed import seed_data
        seed_data()
    
    print("数据库重置完成！")

if __name__ == '__main__':
    # 检查是否需要重置数据库
    if len(sys.argv) > 1 and sys.argv[1] == '--reset-db':
        reset_database()
        sys.exit(0)
        
    print("启动街舞社官网后端API服务...")
    print(f"数据库路径: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("API文档地址: http://127.0.0.1:5000/")
    print("可用端点:")
    print("  POST   /api/auth/register - 用户注册")
    print("  POST   /api/auth/login - 用户登录")
    print("  GET    /api/users/me - 获取当前用户信息")
    print("  GET    /api/courses - 获取所有课程")
    print("  GET    /api/courses/<id> - 获取单个课程详情")
    print("  POST   /api/courses/<id>/book - 预订课程")
    print("  DELETE /api/courses/<id>/cancel - 取消预订")
    print("  GET    /api/users/bookings - 获取用户的所有预订")
    print("\n如果遇到数据库问题，可以使用以下命令重置数据库:")
    print("  python run.py --reset-db")
    print("\n按 Ctrl+C 停止服务器")
    app.run(host='0.0.0.0', port=5000, debug=True) 