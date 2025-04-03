# 街舞社官网后端API

## 项目简介

这是一个基于Flask的街舞社官网后端API服务，提供用户认证、课程管理和预订管理功能。使用SQLite作为数据库，轻量级且易于部署。

## 数据库配置

本项目使用SQLite数据库，默认数据库文件名为`streetdance.db`。如需修改数据库配置，请在`.env`文件中更新`DATABASE_URL`变量。

```
# 数据库配置示例
DATABASE_URL=sqlite:///streetdance.db
```

## 最近更新 (2025-04-05)

### 代码优化与安全性提升

1. **代码整合与简化**：
   - 合并了`run.py`和`run_fixed.py`，保留所有增强的认证功能，减少冗余代码
   - 移除了敏感信息的控制台输出，提高了安全性
   - 简化了调试工具的日志输出，只保留必要的信息

2. **敏感信息保护**：
   - 减少了数据库配置信息、令牌内容等敏感数据的控制台输出
   - 优化了认证调试工具，避免了令牌完整内容的显示
   - 提高了日志记录的安全性

3. **代码可维护性提升**：
   - 规范化了认证相关函数的命名和行为
   - 提高了代码注释的质量，使维护更加容易
   - 确保JWT处理过程的一致性，避免数据类型错误

## 最近更新 (2025-04-04)

### 修复JWT令牌问题

修复了前端切换页面后导致JWT令牌验证失败的关键问题，主要修复内容：

1. **修复JWT令牌格式问题**：
   - 修复了令牌中`sub`（subject）字段的数据类型问题，确保用户ID始终以字符串形式存储
   - 解决了出现的`Subject must be a string`错误，提高了令牌验证的可靠性

2. **增强错误调试**：
   - 添加了详细的JWT验证日志输出
   - 优化了错误处理流程，便于诊断类似问题

3. **认证机制健壮性增强**：
   - 规范化了所有JWT令牌的创建过程
   - 改进了令牌验证和刷新机制，使其更加可靠

### 修复认证问题

修复了前端切换页面后后端不认识token的问题，具体改进包括：

1. **增强认证机制**：
   - 修复了CORS配置，现在支持使用凭据进行跨域请求
   - 所有API请求均支持cookie中的JWT认证
   - 增加了请求级别的token刷新机制，进一步提高可靠性

2. **JWT配置优化**：
   - 延长了token有效期至1天，减少用户重新登录频率
   - 增加了无感刷新机制，自动维护登录状态
   - 改进了auto-refresh端点，可以从多种来源验证身份

3. **调试工具**：
   - 增强了认证调试功能，便于排查问题
   - 提供了多种令牌修复工具，可以在失效时快速恢复

#### 前端集成建议

为了充分利用这些改进，建议前端开发者：

1. 确保所有请求包含凭据：
   ```javascript
   fetch('/api/endpoint', {
     credentials: 'include'
   });
   ```

2. 在应用初始化时调用auto-refresh接口：
   ```javascript
   async function refreshAuth() {
     try {
       const response = await fetch('/api/auth/auto-refresh', {
         credentials: 'include'
       });
       if (response.ok) {
         const data = await response.json();
         // 更新本地状态
       }
     } catch (error) {
       console.error('刷新认证失败:', error);
     }
   }
   ```

3. 在路由变化时保持认证状态：
   ```javascript
   // React Router示例
   router.beforeEach(async (to, from, next) => {
     await refreshAuth();
     next();
   });
   ```

## 最近更新 (2025-04-03)

### 认证机制增强

为解决在切换页面时频繁要求重新登录的问题，系统进行了以下增强：

1. **双重认证机制**：系统现在同时支持 Header 认证和 Cookie 认证，大大提高了认证的可靠性
2. **Cookie 存储 Token**：登录和刷新 Token 时，系统会同时将 Token 存储在 Cookie 中
3. **自动刷新机制**：新增了自动刷新接口，可用于保持会话活跃
4. **登出接口增强**：登出时会同时清除 Cookie 中的 Token

#### 新增和增强的接口

1. **自动刷新令牌**
   - **URL**: `/api/auth/auto-refresh`
   - **方法**: `GET`
   - **说明**: 如果用户已登录，此接口会自动刷新令牌并返回最新的用户信息
   - **返回示例**:
     ```json
     {
       "success": true,
       "data": {
         "user": {
           "id": 1,
           "username": "example",
           "name": "示例用户",
           "email": "user@example.com",
           "role": "member",
           "danceType": "breaking"
         }
       },
       "message": "令牌已刷新"
     }
     ```

2. **用户登出**
   - **URL**: `/api/auth/logout`
   - **方法**: `POST`
   - **说明**: 清除用户的登录状态，包括 Cookie 中的令牌
   - **返回示例**:
     ```json
     {
       "success": true,
       "message": "登出成功"
     }
     ```

### 前端集成建议

1. **页面加载自动刷新**：
   ```javascript
   // 在每个页面加载时调用此函数
   async function checkAndRefreshAuth() {
     try {
       const response = await fetch('/api/auth/auto-refresh', {
         credentials: 'include' // 重要！确保发送和接收Cookie
       });
       
       if (response.ok) {
         const data = await response.json();
         if (data.success && data.data.user) {
           // 更新本地用户信息
           updateUserState(data.data.user);
         }
       }
     } catch (error) {
       console.error('自动刷新失败:', error);
     }
   }
   
   // 在页面加载时执行
   document.addEventListener('DOMContentLoaded', checkAndRefreshAuth);
   ```

2. **API请求配置**：
   ```javascript
   // 配置所有API请求
   async function apiRequest(url, options = {}) {
     // 确保每个请求都包含credentials
     const requestOptions = {
       ...options,
       credentials: 'include',
       headers: {
         ...options.headers,
         'Content-Type': 'application/json'
       }
     };
     
     // 发送请求
     return fetch(url, requestOptions);
   }
   ```

3. **登出处理**：
   ```javascript
   async function logout() {
     try {
       await apiRequest('/api/auth/logout', { method: 'POST' });
       // 清除本地存储的用户信息
       clearUserState();
       // 重定向到登录页
       window.location.href = '/login';
     } catch (error) {
       console.error('登出失败:', error);
     }
   }
   ```

## 最近更新

**2025-03-28 更新**

1. 为"舞种管理"页面增强以下接口：
   - 更新 `/api/users/dance-type/{danceType}` - 现在返回所有该舞种的用户，不再限制角色，并添加注册时间字段
   - 新增 `/api/courses/recent/dance-type/{danceType}` - 获取特定舞种最近的课程及详细预约名单
   - 增强 `/api/courses/{courseId}` - 返回更详细的预约用户信息，包括预约时间

2. 接口数据格式更新：
   - 预约用户信息现在包含 id、name、username 和 bookingTime
   - 用户信息现在包含 created_at 字段表示注册时间
   - 所有时间戳均使用 ISO 格式，并包含 Z 后缀表示 UTC 时间

3. 权限控制维持不变：
   - 领队只能查看自己舞种的成员和课程
   - 管理员可以查看所有舞种的成员和课程

**2023-04-15 更新**

1. 增强课程时间合理性检查:
   - 新增对不合理时间段的检测功能
   - 自动识别跨夜课程（结束时间早于开始时间）
   - 限制课程时长在30分钟至4小时之间
   - 显示详细的错误信息，包括具体的时间冲突原因
   - 提高课程安排的规范性和用户体验

**2023-04-10 更新**

1. 新增课程时间冲突检查功能:
   - 在创建课程时会自动检查相同地点和时间段是否已有其他课程
   - 在更新课程时检查修改后的时间和地点是否与其他课程冲突
   - 当存在冲突时会返回详细的冲突课程信息
   - 确保同一时间同一地点不会安排多个课程，提高资源利用效率

2. 安全数据更新:
   - 提供一键更新脚本 `python update_all.py`，顺序执行更新领队和课程数据
   - 更新领队用户脚本 `python update_leaders.py`，安全删除和创建领队用户
   - 更新课程数据脚本 `python update_courses.py`，为领队创建示例课程

**2023-04-03 更新**

1. 为个人信息页面提供的新增API接口:
   - `/api/bookings/user` - 获取用户预约记录（包含完整课程信息）
   - 修复 `/api/users/{userId}/role` - 支持普通用户修改舞种偏好
   - 更新 `/api/courses/{courseId}/cancel` - 移除角色限制，允许所有用户取消预约

2. 数据模型更新:
   - 为Booking模型添加updated_at字段
   - 为Course模型添加get_weekday_name方法
   - 接口支持dance_type和danceType两种参数格式，提高兼容性

3. 数据库迁移:
   - 添加了手动迁移脚本 `migrations/add_updated_at.py`，用于向已存在的数据库添加新字段
   - 集成了Flask-Migrate支持，便于未来的数据库结构变更
   - 使用方法：`python migrations/add_updated_at.py`

4. 增加舞种领队:
   - 新增Jazz、Waacking和Urban三个舞种及对应领队
   - 支持从环境变量配置所有领队信息
   - 领队数据初始化更加灵活，便于扩展
   - 添加了安全的领队更新脚本：`python update_leaders.py`，可以安全地更新领队而不影响其他数据
   - 添加课程更新脚本：`python update_courses.py`，为新的领队创建对应的课程

## 安全更新数据

系统提供了几个安全的数据更新脚本，可以在不影响其他数据的情况下更新领队和课程：

1. **一键更新所有数据**
   ```bash
   python update_all.py
   ```
   此脚本会依次执行更新领队和更新课程的操作，最适合快速完成所有更新。

2. **更新领队用户**
   ```bash
   python update_leaders.py
   ```
   此脚本会删除原有的领队用户，并根据环境变量创建新的领队用户。与数据库重置不同，
   此操作不会影响已有的普通用户和管理员用户。

3. **更新课程数据**
   ```bash
   python update_courses.py
   ```
   此脚本会为所有领队用户创建示例课程。可以在更新领队后运行，以确保每个领队都有对应的课程。

**2023-04-02 更新**

1. 数据库模型更改:
   - 将课程的`weekday`字段改为`course_date`，类型由字符串改为日期类型。
   - 为课程模型添加按周查询功能。

2. 新增API接口:
   - `/api/schedule` - 获取某一周的课程安排，前端可传入日期参数。

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

## 用户角色系统

系统设置了三种用户角色，各自拥有不同权限和创建方式：

### 1. **超级管理员(admin)**
- **创建方式**: 系统预置唯一的超级管理员账号，在`.env`文件中配置，无法通过注册创建
- **权限**:
  - 管理系统的所有资源，包括用户、课程、预订等
  - 创建和管理舞种领队账号
  - 分配课程归属（设置课程的舞种和领队）
  - 查看系统日志
  - 修改任何用户的信息
  - **无法**预约课程（管理员不需要预约）

### 2. **舞种领队(leader)**
- **创建方式**: 仅超级管理员可以创建舞种领队账号
- **权限**:
  - 负责管理特定舞种的课程和教学
  - 创建和管理自己舞种的课程
  - 查看自己舞种成员和预约情况
  - **无法**预约课程（领队通常是课程的讲师）
  - **无法**自行注册，只能由管理员创建

### 3. **普通社员(member)**
- **创建方式**: 通过公开注册界面自行注册，必须使用大工邮箱并完成邮箱验证
- **权限**:
  - 预约和取消课程
  - 修改自己的基本信息
  - 无管理权限
  - 必须验证大工邮箱才能正常使用系统

## 用户创建流程

### 普通社员注册流程
1. 普通社员通过公开注册界面自行注册，必须使用大连理工大学邮箱(`@mail.dlut.edu.cn`)
2. 系统向用户邮箱发送验证码
3. 用户验证邮箱后才能正常登录和使用系统
4. 普通社员**无法**将自己升级为领队或管理员

### 舞种领队创建流程
1. 超级管理员登录系统
2. 通过管理界面创建舞种领队账号
3. 指定舞种领队的用户名、密码、姓名和负责的舞种
4. 领队账号创建后可以立即使用，无需邮箱验证

### 超级管理员配置
1. 超级管理员账号在系统初始化时通过`.env`文件配置
2. 配置项包括：`ADMIN_USERNAME`、`ADMIN_PASSWORD`和`ADMIN_NAME`
3. 默认值为：用户名`admin`、密码`admin123`、姓名`超级管理员`

## API接口说明

### 一、用户认证模块

#### 1. 用户注册 (仅限普通社员)

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **说明**: 只允许注册普通社员账号，且必须使用大连理工大学邮箱
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "name": "真实姓名",
    "email": "邮箱地址（必须是@mail.dlut.edu.cn结尾）",
    "password": "密码"
  }
  ```
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "userId": 8,
      "email": "student@mail.dlut.edu.cn",
      "emailVerified": false
    },
    "message": "注册成功，请查收验证码邮件"
  }
  ```

#### 2. 验证邮箱

- **URL**: `/api/auth/verify-email`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "userId": 8,
    "code": "123456"
  }
  ```
- **说明**: 用户填写收到的验证码完成邮箱验证。验证成功后会返回用户信息和令牌。
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 8,
        "username": "student",
        "name": "张三",
        "email": "student@mail.dlut.edu.cn",
        "role": "member",
        "danceType": null,
        "emailVerified": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "邮箱验证成功"
  }
  ```

#### 3. 重新发送验证码

- **URL**: `/api/auth/resend-verification`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "email": "student@mail.dlut.edu.cn"
  }
  ```
- **说明**: 如果未收到验证码或验证码过期，可以请求重新发送验证码。
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "userId": 8,
      "email": "student@mail.dlut.edu.cn"
    },
    "message": "验证码已重新发送，请查收邮件"
  }
  ```

#### 4. 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```

#### 5. 获取当前用户信息

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
   - 可以分配课程归属（设置课程的舞种和领队）

2. **舞种领队(leader)**
   - 每位领队负责一种特定舞种(breaking、popping、hiphop、locking等)
   - 负责本舞种的课程和教学
   - **无法**预约课程（领队通常是课程的讲师）
   - 可以查看自己负责舞种的预约情况
   - 只能管理自己舞种的课程

3. **普通社员(member)**
   - 普通用户，街舞社的成员
   - 可以预约和取消课程
   - 无管理权限

## 四、课程管理模块（管理员和领队接口）

### 1. 获取课程列表（管理员和领队）

- **URL**: `/api/admin/courses`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **说明**: 管理员可以获取所有课程，领队只能获取自己舞种的课程和公共课程

### 2. 创建课程

- **URL**: `/api/admin/courses`
- **方法**: `POST`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **请求参数**:
  ```json
  {
    "name": "课程名称",
    "instructor": "教师名称",
    "location": "上课地点",
    "weekday": "星期几",
    "timeSlot": "时间段",
    "maxCapacity": 20,
    "description": "课程描述",
    "danceType": "舞种类型",  // 可选，仅管理员可设置
    "leaderId": 1            // 可选，仅管理员可设置
  }
  ```
- **说明**: 管理员可以创建任何舞种的课程，领队只能创建自己舞种的课程

### 3. 更新课程信息

- **URL**: `/api/admin/courses/{courseId}`
- **方法**: `PUT`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **请求参数**:
  ```json
  {
    "name": "课程名称",
    "instructor": "教师名称",
    "location": "上课地点",
    "weekday": "星期几",
    "timeSlot": "时间段",
    "maxCapacity": 20,
    "description": "课程描述",
    "danceType": "舞种类型",  // 可选，仅管理员可设置
    "leaderId": 1            // 可选，仅管理员可设置
  }
  ```
- **说明**: 管理员可以更新任何课程，领队只能更新自己舞种的课程

### 4. 删除课程

- **URL**: `/api/admin/courses/{courseId}`
- **方法**: `DELETE`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **说明**: 管理员可以删除任何课程，领队只能删除自己舞种的课程

### 5. 获取课程分配情况（仅管理员）

- **URL**: `/api/admin/courses/assignments`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **返回示例**:
  ```json
  {
    "success": true,
    "data": [
      {
        "leaderId": 1,
        "leaderName": "张领队",
        "danceType": "breaking",
        "courseCount": 2
      },
      {
        "leaderId": 2,
        "leaderName": "李领队",
        "danceType": "popping",
        "courseCount": 1
      },
      {
        "danceType": "public",
        "courseCount": 1
      }
    ]
  }
  ```

### 6. 分配课程归属（仅管理员）

- **URL**: `/api/admin/courses/{courseId}/assign`
- **方法**: `PUT`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```
- **请求参数**:
  ```json
  {
    "danceType": "舞种类型",  // 设置为 "public" 表示公共课程
    "leaderId": 1            // 设置为 0 表示公共课程
  }
  ```
- **说明**: 只需提供 danceType 或 leaderId 其中一个参数即可。如果提供 leaderId，系统会自动设置对应的舞种类型

## 课程归属说明

系统中的课程可能有以下几种归属方式：

1. **特定舞种课程** - 属于某个舞种，由相应的舞种领队管理
   - 设置了 dance_type 和 leader_id
   - 只有对应的领队和管理员可以管理

2. **公共课程** - 不属于特定舞种，所有人都可以预约
   - dance_type 和 leader_id 均为 null
   - 只有管理员可以管理

超级管理员可以：
- 创建任何舞种的课程或公共课程
- 修改任何课程的信息和归属
- 删除任何课程

舞种领队可以：
- 创建和管理自己舞种的课程
- 无法修改课程归属
- 无法管理其他舞种的课程或公共课程

## 测试账号

系统预置了以下测试账号：

1. 超级管理员账号
   - 用户名: admin
   - 密码: admin123

2. 舞种领队账号
   - Hiphop领队: hiphop_leader
   - Breaking领队: breaking_leader
   - Locking领队: locking_leader
   - Popping领队: popping_leader
   - Jazz领队: jazz_leader
   - Waacking领队: waacking_leader
   - Urban领队: urban_leader
   - 所有领队密码统一为: leader123

3. 普通社员账号
   - 用户名: member1/member2
   - 密码: member123

## 开发说明

1. 环境变量配置在`.env`文件中
2. 开发环境默认启用调试模式
3. 已配置CORS支持跨域请求
4. 首次运行会自动创建数据库并初始化测试数据

## 邮件服务配置

系统使用 Gmail SMTP 服务发送验证邮件，需要进行以下配置：

1. **环境变量配置**

   在 `.env` 文件中已配置以下参数：
   ```
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_SSL=False
   MAIL_USE_TLS=True
   MAIL_USERNAME=dut.flexcrew@gmail.com
   MAIL_PASSWORD=your-app-password-here
   ```

2. **Gmail 应用专用密码获取**

   由于 Gmail 不支持直接使用账号密码进行 SMTP 认证，需要生成"应用专用密码"：
   - 登录 Gmail 账号
   - 访问 [Google 账号安全设置](https://myaccount.google.com/security)
   - 开启两步验证（如果尚未开启）
   - 在"应用专用密码"部分创建新密码
   - 将生成的密码填入 `.env` 文件的 `MAIL_PASSWORD` 字段

3. **测试邮件功能**

   配置完成后，可以使用以下命令测试邮件功能：
   ```
   python -m app.utils.test_email your-test-email@mail.dlut.edu.cn
   ```

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
- **权限**: 仅超级管理员可访问
- **说明**: 获取系统中所有用户的信息。

#### 4. 按角色获取用户

- **URL**: `/api/users/role/{role}`
- **方法**: `GET`
- **权限**: 仅超级管理员可访问
- **参数**: role可以是'admin'、'leader'或'member'
- **说明**: 按角色筛选用户。 

### 9. 获取舞种的成员列表 (管理员和舞种领队)

- **URL**: `/api/users/dance-type/{danceType}`
- **方法**: `GET`
- **权限**: 管理员可查看任何舞种，领队只能查看自己舞种
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 获取特定舞种的所有用户列表（包括领队和成员）
- **返回格式**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "username": "breaking_leader",
        "name": "Breaking领队",
        "email": "breaking_leader@example.com",
        "role": "leader",
        "danceType": "breaking",
        "created_at": "2025-03-28T10:00:00Z"
      },
      {
        "id": 5,
        "username": "member3",
        "name": "张三",
        "email": "member3@example.com",
        "role": "member",
        "danceType": "breaking",
        "created_at": "2025-03-28T11:30:00Z"
      }
    ]
  }
  ```

### 10. 获取特定舞种最近课程 (管理员和舞种领队)

- **URL**: `/api/courses/recent/dance-type/{danceType}`
- **方法**: `GET`
- **权限**: 管理员可查看任何舞种，领队只能查看自己舞种
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**: 
  - `limit`: 查询参数，可选，限制返回的课程数量，默认为10
- **功能描述**: 获取特定舞种最近的课程记录及详细预约情况
- **返回格式**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 5,
        "name": "Breaking进阶班",
        "instructor": "王老师",
        "location": "舞蹈室A",
        "weekday": "周四",
        "courseDate": "2025-04-03",
        "timeSlot": "19:00-20:30",
        "maxCapacity": 15,
        "bookedCount": 2,
        "danceType": "breaking",
        "leaderId": 2,
        "description": "适合有基础的学员",
        "bookedBy": [
          {
            "id": 5,
            "name": "张三",
            "username": "member3",
            "bookingTime": "2025-03-29T14:20:30Z"
          },
          {
            "id": 6,
            "name": "李四",
            "username": "member4",
            "bookingTime": "2025-03-29T15:45:22Z"
          }
        ]
      },
      // 更多课程...
    ]
  }
  ```

### 11. 获取课程详细信息 (所有用户)

- **URL**: `/api/courses/{courseId}`
- **方法**: `GET`
- **功能描述**: 获取特定课程的详细信息，包括预约名单
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 5,
      "name": "Breaking进阶班",
      "instructor": "王老师",
      "location": "舞蹈室A",
      "weekday": "周四",
      "courseDate": "2025-04-03",
      "timeSlot": "19:00-20:30",
      "maxCapacity": 15,
      "bookedCount": 2,
      "danceType": "breaking",
      "leaderId": 2,
      "description": "适合有基础的学员",
      "bookedBy": [
        {
          "id": 5,
          "name": "张三",
          "username": "member3",
          "bookingTime": "2025-03-29T14:20:30Z"
        },
        {
          "id": 6,
          "name": "李四",
          "username": "member4",
          "bookingTime": "2025-03-29T15:45:22Z"
        }
      ]
    }
  }
  ```

### 12. 获取用户预约记录（包含完整课程信息）

- **URL**: `/api/bookings/user`
- **方法**: `GET`
- **权限**: 所有登录用户
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 获取当前用户的所有预约记录（包括已取消的），按预约时间倒序排列，包含完整的课程信息
- **返回格式**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 25,
        "userId": 3,
        "courseId": 2,
        "status": "confirmed", // 或 "canceled"
        "createdAt": "2023-03-28T15:30:00Z",
        "updatedAt": "2023-03-29T10:15:30Z",
        // 课程详细信息
        "name": "Breaking基础班",
        "instructor": "张教练",
        "location": "舞蹈室A",
        "courseDate": "2023-04-05",
        "weekday": "周三",
        "timeSlot": "19:00-20:30",
        "dance_type": "breaking",
        "danceType": "breaking"
      },
      // 更多预约记录...
    ]
  }
  ```

## 五、用户管理模块

### 1. 获取所有用户

- **URL**: `/api/users`
- **方法**: `GET`
- **权限**: 仅管理员
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 获取系统中所有用户的列表
- **返回格式**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "username": "admin",
        "name": "超级管理员",
        "email": "admin@example.com",
        "role": "admin",
        "danceType": null
      },
      {
        "id": 2,
        "username": "leader1",
        "name": "张领队",
        "email": "leader1@example.com",
        "role": "leader",
        "danceType": "breaking"
      }
    ]
  }
  ```

### 2. 按角色获取用户

- **URL**: `/api/users/role/{role}`
- **方法**: `GET`
- **权限**: 仅管理员
- **参数**: `role` - 用户角色 (`admin`, `leader`, `member`)
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 获取指定角色的所有用户列表
- **返回格式**: 同上

### 3. 更新用户资料

- **URL**: `/api/users/profile`
- **方法**: `PATCH`
- **权限**: 用户可以更新自己的资料，管理员可以更新任何用户
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**:
  ```json
  {
    "userId": 3,  // 可选，仅管理员可指定其他用户ID
    "name": "新名称",
    "email": "新邮箱"
  }
  ```
- **功能描述**: 更新用户的基本资料信息
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 3,
      "username": "member1",
      "name": "新名称",
      "email": "新邮箱",
      "role": "member",
      "danceType": null
    },
    "message": "用户资料更新成功"
  }
  ```

### 4. 更新用户密码

- **URL**: `/api/users/password`
- **方法**: `PATCH`
- **权限**: 用户只能更改自己的密码，管理员可以更改任何用户密码
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**:
  ```json
  {
    "userId": 3,  // 可选，仅管理员可指定其他用户ID
    "currentPassword": "当前密码",  // 非管理员用户修改自己密码时必填
    "newPassword": "新密码"
  }
  ```
- **功能描述**: 更新用户密码，普通用户需要提供当前密码，管理员可以直接重置
- **返回格式**:
  ```json
  {
    "success": true,
    "message": "密码更新成功"
  }
  ```

### 5. 创建新用户 (仅管理员)

- **URL**: `/api/users`
- **方法**: `POST`
- **权限**: 仅管理员
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**:
  ```json
  {
    "username": "新用户名",
    "name": "显示名称",
    "email": "用户邮箱",
    "password": "初始密码",
    "role": "leader",
    "dance_type": "舞种类型" // 必填，指定领队负责的舞种
  }
  ```
- **功能描述**: 管理员创建舞种领队用户。普通社员只能通过公开注册接口自行注册，不能由管理员创建。
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 8,
      "username": "新用户名",
      "name": "显示名称",
      "email": "用户邮箱",
      "role": "leader",
      "danceType": "breaking"
    },
    "message": "领队用户创建成功"
  }
  ```

### 6. 更新用户角色和舞种 (仅管理员)

- **URL**: `/api/users/{userId}/role`
- **方法**: `PUT`
- **权限**: 仅管理员
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**:
  ```json
  {
    "role": "leader",
    "dance_type": "breaking"  // 角色为leader时必填
  }
  ```
- **功能描述**: 管理员可以更改用户的角色和舞种属性
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 3,
      "username": "member1",
      "name": "社员一",
      "email": "member1@example.com",
      "role": "leader",
      "danceType": "breaking"
    },
    "message": "用户角色更新成功"
  }
  ```

### 7. 更新用户舞种 (管理员和领队)

- **URL**: `/api/users/{userId}/dance-type`
- **方法**: `PUT`
- **权限**: 管理员可更新任何用户，领队只能更新自己舞种的成员
- **认证**: 需要JWT令牌（`Bearer Token`）
- **请求参数**:
  ```json
  {
    "danceType": "breaking"  // 设置为null或空字符串表示清除舞种
  }
  ```
- **功能描述**: 更新用户的舞种归属
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 3,
      "username": "member1",
      "name": "社员一",
      "email": "member1@example.com",
      "role": "member",
      "danceType": "breaking"
    },
    "message": "用户舞种更新成功"
  }
  ```

### 8. 删除用户 (仅管理员)

- **URL**: `/api/users/{userId}`
- **方法**: `DELETE`
- **权限**: 仅管理员
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 删除指定用户，同时会处理该用户关联的所有数据
- **返回格式**:
  ```json
  {
    "success": true,
    "message": "用户删除成功"
  }
  ```

## 最近更新 (2025-03-28)

### Token刷新机制

为解决在服务器环境下令牌频繁过期的问题，系统新增了以下功能：

1. **令牌过期时间调整**：所有环境下默认令牌有效期统一为1天
2. **新增令牌刷新接口**：客户端可以在令牌即将过期时调用刷新接口

#### 令牌刷新API

- **URL**: `/api/auth/refresh-token`
- **方法**: `POST`
- **权限**: 需要有效的JWT令牌
- **认证**: 需要JWT令牌（`Bearer Token`）
- **功能描述**: 使用有效的JWT令牌获取新的JWT令牌
- **返回格式**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "令牌刷新成功"
  }
  ```

### 环境配置说明

系统现在支持两种启动方式：

1. **开发环境启动**：
   ```bash
   python run.py
   ```

2. **生产环境启动**：
   ```bash
   python run_production.py
   ```

两种环境的主要区别：
- 开发环境：启用调试模式，JWT令牌有效期为1天
- 生产环境：禁用调试模式，JWT令牌有效期为1天（已与开发环境统一）