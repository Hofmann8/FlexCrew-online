"""添加 updated_at 字段到 bookings 表

此脚本用于手动执行数据库迁移，添加 updated_at 字段到 bookings 表。
使用方式：
python migrations/add_updated_at.py
"""

import os
import sys
import sqlite3
from datetime import datetime

def main():
    # 获取数据库文件路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    # 寻找数据库文件
    db_file = None
    possible_paths = [
        os.path.join(project_root, 'streetdance.db'),
        os.path.join(project_root, 'instance', 'streetdance.db'),
        os.path.join(project_root, 'app', 'streetdance.db')
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            db_file = path
            break
    
    if not db_file:
        print("错误: 无法找到数据库文件。请指定正确的数据库路径。")
        sys.exit(1)
    
    print(f"找到数据库文件: {db_file}")
    
    # 连接数据库
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # 检查 bookings 表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'")
        if not cursor.fetchone():
            print("错误: bookings 表不存在")
            conn.close()
            sys.exit(1)
        
        # 检查 updated_at 列是否已存在
        cursor.execute("PRAGMA table_info(bookings)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'updated_at' in column_names:
            print("updated_at 列已存在，无需添加")
            conn.close()
            sys.exit(0)
        
        # 添加 updated_at 列
        cursor.execute("ALTER TABLE bookings ADD COLUMN updated_at DATETIME")
        conn.commit()
        print("成功添加 updated_at 列到 bookings 表")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
        if conn:
            conn.close()
        sys.exit(1)

if __name__ == "__main__":
    main() 