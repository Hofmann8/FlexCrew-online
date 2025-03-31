# 街舞社官网后端API

## 项目简介

这是一个基于Flask的街舞社官网后端API服务，提供用户认证、课程管理和预订管理功能。使用SQLite作为数据库，轻量级且易于部署。

## 技术栈

- Python 3.8+
- Flask 2.3.3
- Flask-SQLAlchemy 3.1.1
- Flask-JWT-Extended 4.5.3
- Flask-CORS 4.0.0
- SQLite 数据库

## 目录结构

```
backend-flask/
│
├── app/                  # 应用主目录
│   ├── __init__.py       # 应用初始化
│   ├── api/              # API模块
│   │   ├── __init__.py
│   │   └── routes.py     # API路由定义
│   ├── auth/             # 认证模块
│   │   ├── __init__.py
│   │   └── routes.py     # 认证路由定义
│   ├── models/           # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py       # 用户模型
│   │   └── course.py     # 课程和预订模型
│   └── seed.py           # 初始数据
│
├── tests/                # 测试目录
│   ├── __init__.py
│   └── test_api.py       # API测试
│
├── .env                  # 环境变量配置
├── app.py                # 应用入口
├── config.py             # 应用配置
├── requirements.txt      # 项目依赖
├── run.py                # 运行脚本
└── README.md             # 项目说明
```

## 安装与运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 运行开发服务器

```bash
python run.py
```

或者使用Flask命令：

```bash
flask run
```

## API接口说明

### 一、用户认证模块

#### 1. 用户注册

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "name": "真实姓名",
    "email": "邮箱地址",
    "password": "密码"
  }
  ```

#### 2. 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```

#### 3. 获取当前用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

### 二、课程管理模块

#### 1. 获取所有课程

- **URL**: `/api/courses`
- **方法**: `GET`

#### 2. 获取单个课程详情

- **URL**: `/api/courses/{courseId}`
- **方法**: `GET`

### 三、预订管理模块

#### 1. 预订课程

- **URL**: `/api/courses/{courseId}/book`
- **方法**: `POST`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **说明**: 此API同时支持新预订和重新激活已取消的预订。如果用户之前已取消预订此课程，系统会自动将状态更改为已确认。

#### 2. 取消预订

- **URL**: `/api/courses/{courseId}/cancel`
- **方法**: `DELETE`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **说明**: 此API支持取消任何状态的预订。如果预订已经是取消状态，API会返回成功消息而不报错。

#### 3. 获取用户的所有预订

- **URL**: `/api/users/bookings`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

#### 4. 查询用户对特定课程的预订状态

- **URL**: `/api/users/booking-status/{courseId}`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "courseId": 1,
      "status": "confirmed",  // "confirmed" (已预订), "canceled" (已取消), "not_booked" (未预订)
      "bookingId": 1,
      "courseName": "Breaking基础班",
      "bookingTime": "2025-03-29T12:00:00Z"  // 预订时间
    }
  }
  ```

## 预订状态说明

系统中的预订可能有以下几种状态:

1. **confirmed** (已确认) - 预订成功且有效
2. **canceled** (已取消) - 用户已取消的预订
3. **not_booked** (未预订) - 未找到预订记录时的标识

用户可以:
- 对未预订课程进行预订 -> 创建新预订记录(confirmed)
- 对已确认课程进行取消 -> 修改为canceled状态
- 对已取消课程重新预订 -> 修改为confirmed状态

## 用户角色与权限

系统设置了三种用户角色，各自拥有不同权限：

1. **超级管理员(admin)**
   - 拥有系统最高权限
   - 可以管理所有舞种、课程和用户
   - **无法**预约课程（管理员不需要预约）

2. **舞种领队(leader)**
   - 每位领队负责一种特定舞种(breaking、popping、hiphop、locking等)
   - 负责本舞种的课程和教学
   - **无法**预约课程（领队通常是课程的讲师）
   - 可以查看自己负责舞种的预约情况

3. **普通社员(member)**
   - 普通用户，街舞社的成员
   - **唯一可以预约课程的角色**
   - 可以预约和取消课程
   - 可以查看自己的预约记录

注意：只有普通社员(member)角色才能预约和取消课程，管理员和领队无权执行这些操作。

## 测试账号

系统预置了以下测试账号：

1. 超级管理员账号
   - 用户名: admin
   - 密码: admin123

2. 舞种领队账号
   - 用户名: leader1 (Breaking领队)
   - 用户名: leader2 (Popping领队)
   - 用户名: leader3 (Hip-Hop领队)
   - 用户名: leader4 (Locking领队)
   - 密码: leader123

3. 普通社员账号
   - 用户名: member1/member2
   - 密码: member123

## 开发说明

1. 环境变量配置在`.env`文件中
2. 开发环境默认启用调试模式
3. 已配置CORS支持跨域请求
4. 首次运行会自动创建数据库并初始化测试数据

## 测试工具

项目包含以下测试脚本:

1. **test_api.py** - 单元测试
2. **query_api.py** - 测试公开API
3. **query_auth_api.py** - 测试需要认证的API
4. **query_cancel_booking.py** - 测试取消预订功能
5. **query_booking_status.py** - 测试查询预订状态功能

### 四、用户和舞种领队管理模块

#### 1. 获取所有舞种领队

- **URL**: `/api/leaders`
- **方法**: `GET`
- **说明**: 此API返回所有舞种领队的信息，包括他们负责的舞种。

#### 2. 获取特定舞种的领队

- **URL**: `/api/leaders/{danceType}`
- **方法**: `GET`
- **说明**: 根据舞种类型获取对应的领队信息。

#### 3. 获取所有用户

- **URL**: `/api/users`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **权限**: 仅超级管理员可访问
- **说明**: 获取系统中所有用户的信息。

#### 4. 按角色获取用户

- **URL**: `/api/users/role/{role}`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **权限**: 仅超级管理员可访问
- **参数**: role可以是'admin'、'leader'或'member'
- **说明**: 按角色筛选用户。 