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
- **领队管理**：展示各舞种领队信息及他们负责的课程
- **现代化UI**：简洁直观的界面，流畅的动画效果
- **持久化登录**：页面刷新后保持用户认证状态
- **后台管理**：管理员可管理用户、课程和预订

## 技术栈概览

### 前端技术栈

- **框架**：Next.js 14
- **样式**：Tailwind CSS
- **字体**：Geist Sans, Geist Mono
- **状态管理**：React Context API
- **API集成**：Fetch API
- **通知系统**：React Hot Toast
- **图标**：React Icons 库
- **动画**：Intersection Observer API

### 后端技术栈

- **框架**：Flask 2.3.3
- **ORM**：Flask-SQLAlchemy 3.1.1
- **认证**：Flask-JWT-Extended 4.5.3
- **跨域支持**：Flask-CORS 4.0.0
- **数据库**：SQLite
- **邮件服务**：用于用户验证

## 功能详情

### 用户角色系统

系统设置了三种用户角色，各自拥有不同权限：

1. **超级管理员**
   - 拥有系统最高权限
   - 可以管理所有舞种、课程和用户
   - 创建和管理舞种领队账号
   - 分配课程归属（设置课程的舞种和领队）
   - **无法**预约课程（管理员不需要预约）

2. **舞种领队**
   - 每位领队负责一种特定舞种(breaking、popping、hiphop、locking等)
   - 负责本舞种的课程和教学
   - 创建和管理自己舞种的课程
   - 查看自己舞种的预约情况
   - **无法**预约课程（领队通常是课程的讲师）

3. **普通社员**
   - 街舞社的注册成员
   - **唯一可以预约课程的角色**
   - 可以预约和取消课程
   - 查看自己的预约记录
   - 修改自己的基本信息

### 课程管理系统

#### 管理员功能
- 查看所有课程（所有舞种和公共课程）
- 创建新课程（可指定舞种和负责领队）
- 编辑现有课程的所有信息
- 删除任何课程
- 管理课程归属（可将课程分配给特定舞种或设为公共课程）
- 查看课程分配统计信息

#### 舞种领队功能
- 查看自己舞种的所有课程
- 创建新课程（自动关联到自己的舞种）
- 编辑自己舞种的课程信息
- 删除自己舞种的课程

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
- 自定义滚动容器和美观的滚动条

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

项目使用环境变量来存储配置信息。在项目根目录创建 `.env.local` 文件（开发环境）或在生产环境中配置必要的环境变量。更多详情请参考前端目录中的README文件。

**注意**：所有以 `NEXT_PUBLIC_` 开头的环境变量在客户端代码中可见。不要在这些变量中存储敏感信息。

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
- **说明**: 用于注册新用户

##### 2. 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`

##### 3. 获取当前用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **需要认证**: 是

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
- **需要认证**: 是
- **说明**: 此API同时支持新预订和重新激活已取消的预订

##### 2. 取消预订

- **URL**: `/api/courses/{courseId}/cancel`
- **方法**: `DELETE`
- **需要认证**: 是

##### 3. 获取用户的所有预订

- **URL**: `/api/users/bookings`
- **方法**: `GET`
- **需要认证**: 是

##### 4. 查询用户对特定课程的预订状态

- **URL**: `/api/users/booking-status/{courseId}`
- **方法**: `GET`
- **需要认证**: 是

#### 四、用户和舞种领队管理模块

##### 1. 获取所有舞种领队

- **URL**: `/api/leaders`
- **方法**: `GET`

## 部署说明

### 前端部署

前端应用可以部署到Vercel或其他支持Next.js的平台：

1. 创建平台账号并连接GitHub仓库
2. 导入项目并配置环境变量
3. 完成部署后，可以通过平台提供的域名访问应用

### 后端部署

后端API可以部署到任何支持Python的服务器：

1. 在服务器上安装Python环境
2. 克隆项目代码并进入后端目录
3. 安装依赖：`pip install -r requirements.txt`
4. 配置环境变量
5. 使用Gunicorn或uWSGI作为生产环境的WSGI服务器
6. 配置Nginx作为反向代理

## 安全注意事项

1. 确保生产环境中更新了默认密码和测试账号
2. 避免在代码中硬编码敏感信息，使用环境变量存储
3. 确保API接口使用JWT认证保护
4. 前端存储敏感信息时使用安全的存储机制
5. 定期更新依赖包以修复安全漏洞

## 版本控制

本仓库仅包含 `frontend-nextjs` 和 `backend-flask` 两个目录的代码，其余文件和目录均被Git忽略。

## 贡献指南

1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature-name`
5. 提交Pull Request 