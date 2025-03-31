# 大连理工大学FlexCrew街舞社官网

本仓库包含大连理工大学FlexCrew街舞社官网的前端和后端代码。这是一个完整的Web应用，提供了街舞社团的介绍、课程管理、用户认证和预订系统等功能。

## 项目结构

- `frontend-nextjs/`: 基于Next.js的前端项目
- `backend-flask/`: 基于Flask的后端API服务

## GitHub仓库

项目代码托管在GitHub上：https://github.com/Hofmann8/FlexCrew-online.git

你可以通过以下命令克隆仓库：

```bash
git clone https://github.com/Hofmann8/FlexCrew-online.git
cd FlexCrew-online
```

## 系统功能

- **响应式设计**：支持各种设备尺寸，提供优秀的移动端体验
- **街舞社介绍**：首页展示社团介绍和特色，配有交互动画效果
- **课程管理**：课程表页面，方便学生查看课程安排
- **用户认证**：支持登录和注册功能，不同角色拥有不同权限
- **课程预订**：社员可预订和取消课程
- **领队管理**：展示各舞种领队信息
- **现代化UI**：简洁直观的界面，流畅的动画效果
- **后台管理**：管理员可管理用户、课程和预订

## 技术栈概览

### 前端技术栈

- **框架**：Next.js 14
- **样式**：Tailwind CSS
- **状态管理**：React Context API
- **API集成**：Fetch API
- **通知系统**：React Hot Toast

### 后端技术栈

- **框架**：Flask 2.3.3
- **ORM**：Flask-SQLAlchemy 3.1.1
- **认证**：Flask-JWT-Extended 4.5.3
- **跨域支持**：Flask-CORS 4.0.0
- **数据库**：SQLite

## 前端详细说明

### 前端功能特点

- 响应式设计，支持各种设备尺寸
- 首页展示社团介绍和特色，配有交互动画效果
- 课程表页面，方便学生查看课程安排
- 现代化UI设计，简洁直观
- 页面滚动动画，提升用户体验
- 平滑滚动效果，增强页面导航体验
- 16:9横版比例图片展示，以四宫格布局呈现活动照片
- 符合规范的ICP备案信息显示
- 详细的课程须知和管理规则说明
- 自定义滚动容器和美观的黄色滚动条

### 前端环境要求

- Node.js 18.0.0或更高版本
- npm 9.0.0或更高版本

### 前端安装与运行

1. 进入前端目录
```bash
cd frontend-nextjs
```

2. 安装依赖
```bash
npm install
# 或者
yarn
```

3. 开发环境运行
```bash
npm run dev
# 或者
yarn dev
```

前端服务将在 http://localhost:3000 运行

4. 构建生产版本
```bash
npm run build
# 或者
yarn build
```

5. 运行生产版本
```bash
npm start
# 或者
yarn start
```

### 前端环境变量配置

项目使用环境变量来存储敏感信息和配置。在项目根目录创建 `.env.local` 文件（开发环境）或在生产环境中配置以下环境变量：

```
# 对象存储基础URL
NEXT_PUBLIC_COS_BASE_URL=https://your-bucket-name.cos.region.myqcloud.com
```

**注意**：所有以 `NEXT_PUBLIC_` 开头的环境变量在客户端代码中可见。不要在这些变量中存储敏感信息。

### 图片资源与防盗链

项目使用腾讯云对象存储服务(COS)托管图片，并配置了防盗链保护。主要图片资源包括：

1. `logo.png` - 社徽完整版
2. `logo-icon.png` - 社徽icon版本
3. `group-photo.jpg` - 社团大合照（横版）
4. `dance1.jpg` - Cypher活动照片（16:9横版）
5. `dance2.jpg` - 大连高校街舞联盟活动照片（16:9横版）
6. `dance3.png` - 社团日常训练照片（16:9横版）
7. `dance4.jpg` - 街舞支教活动照片（16:9横版）

## 后端详细说明

### 后端目录结构

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

### 后端安装与运行

1. 进入后端目录
```bash
cd backend-flask
```

2. 创建虚拟环境并激活
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
复制 `.env.example` 文件（如果存在）到 `.env` 并根据需要修改配置

5. 启动开发服务器
```bash
python run.py
```

后端API将在 http://localhost:5000 运行

### 后端API接口说明

#### 一、用户认证模块

##### 1. 用户注册

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

##### 2. 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```

##### 3. 获取当前用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

#### 二、课程管理模块

##### 1. 获取所有课程

- **URL**: `/api/courses`
- **方法**: `GET`

##### 2. 获取单个课程详情

- **URL**: `/api/courses/{courseId}`
- **方法**: `GET`

#### 三、预订管理模块

##### 1. 预订课程

- **URL**: `/api/courses/{courseId}/book`
- **方法**: `POST`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

##### 2. 取消预订

- **URL**: `/api/courses/{courseId}/cancel`
- **方法**: `DELETE`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

##### 3. 获取用户的所有预订

- **URL**: `/api/users/bookings`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

##### 4. 查询用户对特定课程的预订状态

- **URL**: `/api/users/booking-status/{courseId}`
- **方法**: `GET`
- **请求头**: 
  ```
  Authorization: Bearer {token}
  ```

#### 四、用户和舞种领队管理模块

##### 1. 获取所有舞种领队

- **URL**: `/api/leaders`
- **方法**: `GET`

### 用户角色与权限

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

### 测试账号

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

## 部署说明

### 前端部署

前端应用可以部署到Vercel或其他支持Next.js的平台：

1. 创建Vercel账号并连接GitHub仓库
2. 导入项目并配置环境变量
3. 完成部署后，可以通过Vercel提供的域名访问应用

### 后端部署

后端API可以部署到任何支持Python的服务器，如AWS、阿里云、腾讯云等：

1. 在服务器上安装Python环境
2. 克隆项目代码并进入后端目录
3. 安装依赖：`pip install -r requirements.txt`
4. 配置环境变量
5. 使用Gunicorn或uWSGI作为生产环境的WSGI服务器
6. 配置Nginx作为反向代理

## 版本控制

本仓库仅包含 `frontend-nextjs` 和 `backend-flask` 两个目录的代码，其余文件和目录均被Git忽略。

## 贡献指南

1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature-name`
5. 提交Pull Request 