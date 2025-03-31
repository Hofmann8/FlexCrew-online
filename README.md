# 街舞社官网项目

本仓库包含街舞社官网的前端和后端代码。

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

## 开发环境设置

### 前端（Next.js）

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

3. 启动开发服务器
```bash
npm run dev
# 或者
yarn dev
```

前端服务将在 http://localhost:3000 运行

### 后端（Flask）

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

## 部署

请参考各自目录中的README文件了解更多关于部署的信息。

## 版本控制

本仓库仅包含 `frontend-nextjs` 和 `backend-flask` 两个目录的代码，其余文件和目录均被Git忽略。 