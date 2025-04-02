from app import create_app, db
import os
import sys
from dotenv import load_dotenv

# 打印诊断信息
print("\n===== 数据库配置诊断 =====")
print(f"1. 加载.env前环境变量: DATABASE_URL = {os.environ.get('DATABASE_URL', '未设置')}")

# 重新加载.env文件
load_dotenv(override=True)
print(f"2. 加载.env后环境变量: DATABASE_URL = {os.environ.get('DATABASE_URL', '未设置')}")

# 创建应用
app = create_app()

print(f"3. 应用配置: SQLALCHEMY_DATABASE_URI = {app.config['SQLALCHEMY_DATABASE_URI']}")
print(f"4. 最终数据库文件: {app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')}")
print("===========================\n")

if __name__ == '__main__':
    # 检查是否重置数据库 - 由app/__init__.py中的create_app()函数处理
    if len(sys.argv) > 1 and sys.argv[1] == '--reset-db':
        # 这里不需要再次重置数据库，因为create_app()中已经处理了
        print("数据库重置已完成!")
        sys.exit(0)
        
    print("启动街舞社官网后端API服务...")
    print(f"数据库路径: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("API文档地址: http://127.0.0.1:5000/")
    print("\n如果遇到数据库问题，可以使用以下命令重置数据库:")
    print("  python run.py --reset-db")
    print("\n按 Ctrl+C 停止服务器")
    app.run(host='0.0.0.0', port=5000, debug=True) 