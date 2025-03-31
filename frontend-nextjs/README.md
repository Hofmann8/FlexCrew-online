# 大连理工大学FlexCrew街舞社官网

这是大连理工大学FlexCrew街舞社的官方网站，使用Next.js和Tailwind CSS构建。

## 功能特点

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
- 用户认证系统，支持登录和注册功能
- 课程预订管理，支持预订和取消课程
- 后台API集成，支持真实数据操作

## 技术栈

- **框架**：Next.js 14
- **样式**：Tailwind CSS
- **字体**：Geist Sans, Geist Mono
- **图标**：React Icons 库，提供多种主流图标集合
- **动画**：使用React Hooks和Intersection Observer实现
- **部署**：可部署到Vercel或其他支持Next.js的平台
- **图片存储**：腾讯云对象存储COS
- **状态管理**：React Context API用于用户认证
- **API集成**：使用Fetch API与后端服务交互
- **通知系统**：React Hot Toast实现交互反馈

## 如何使用

### 环境要求

- Node.js 18.0.0或更高版本
- npm 9.0.0或更高版本

### 安装依赖

```bash
npm install
```

主要依赖项包括：
- `next`: Next.js框架
- `react` 和 `react-dom`: React核心库
- `tailwindcss`: 用于样式的工具类CSS框架
- `react-icons`: 用于提供社交媒体和UI图标
- `react-hot-toast`: 用于显示操作反馈通知

### 开发环境运行

```bash
npm run dev
```

访问 http://localhost:3000 查看网站。

### 构建生产版本

```bash
npm run build
```

### 运行生产版本

```bash
npm start
```

## 环境变量配置

项目使用环境变量来存储敏感信息和配置，以提高安全性和灵活性。请在项目根目录创建 `.env.local` 文件（开发环境）或在生产环境中配置以下环境变量：

```
# 对象存储基础URL
NEXT_PUBLIC_COS_BASE_URL=https://your-bucket-name.cos.region.myqcloud.com
```

**注意**：所有以 `NEXT_PUBLIC_` 开头的环境变量在客户端代码中可见。不要在这些变量中存储敏感信息。

## 图片存储

项目使用腾讯云对象存储服务(COS)托管图片，图片路径格式如下：

```
${NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2F{文件名}
```

在组件中使用图片示例：

```jsx
<Image
  src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Flogo.png`}
  alt="Logo"
  width={200}
  height={200}
/>
```

**注意**：路径中的斜杠必须使用 `%2F` 进行URL编码，否则可能导致403错误。

## 图片资源

项目使用腾讯云对象存储服务(COS)托管图片，图片路径从环境变量获取，格式如下：

```
${NEXT_PUBLIC_COS_BASE_URL}/${NEXT_PUBLIC_COS_HOME_PATH}/{文件名}
```

需要以下图片资源：

1. `logo.png` - 社徽完整版
2. `logo-icon.png` - 社徽icon版本
3. `group-photo.jpg` - 社团大合照（横版）
4. `dance1.jpg` - Cypher活动照片（16:9横版）
5. `dance2.jpg` - 大连高校街舞联盟活动照片（16:9横版）
6. `dance3.png` - 社团日常训练照片（16:9横版）
7. `dance4.jpg` - 街舞支教活动照片（16:9横版）

### Next.js图片配置

由于Next.js的Image组件需要配置远程图片域名，已在`next.config.ts`中动态添加对象存储域名：

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_COS_BASE_URL ? new URL(process.env.NEXT_PUBLIC_COS_BASE_URL).hostname : '',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // ...其他配置
};
```

如需添加其他远程图片源，请相应修改此配置。

### 腾讯云COS防盗链配置

本项目使用腾讯云COS的Referer防盗链功能保护图片资源。配置如下：

```jsx
// 示例代码
<Image 
  src={`${NEXT_PUBLIC_COS_BASE_URL}/${NEXT_PUBLIC_COS_HOME_PATH}/logo.png`}
  alt="Logo"
  width={200}
  height={200}
  referrerPolicy="origin"  // 添加引用来源策略
/>
```

### 防盗链设置步骤

1. 在腾讯云COS控制台中，为存储桶配置防盗链设置：
   - **Referer 白名单**：添加允许访问的域名
   - **来源验证方式**：设置为"Referer 白名单"

### 具体操作流程

1. 登录腾讯云COS控制台
2. 进入存储桶 → 安全管理 → 防盗链设置
3. 配置以下参数：
   - 防盗链类型：选择"Referer 白名单方式"
   - Referer 白名单：添加您的网站域名（例如：`*.yourdomain.com`）
   - 是否允许空 Referer：根据需求选择（建议选择"否"）

此配置确保仅在白名单域名下才能访问COS中的图片资源，防止他人盗用。

### Hydration警告处理

为了处理可能出现的React Hydration警告（服务端渲染内容与客户端不匹配的情况），已在`layout.tsx`中添加了`suppressHydrationWarning`属性：

```jsx
<body
  suppressHydrationWarning
  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
>
  {/* 内容 */}
</body>
```

这可以避免由于浏览器扩展或第三方脚本导致的非关键hydration警告。

### 自定义滚动容器

网站使用自定义滚动容器替代浏览器原生滚动，具有以下特点：

1. 移除浏览器默认滚动条，使用自定义样式的滚动条
2. 黄色主题的滚动条，与网站整体设计统一
3. 精确的平滑滚动计算，动态适应不同屏幕尺寸和布局

实现方式：

```css
html, body {
  height: 100%;
  overflow: hidden; /* 禁用浏览器默认滚动 */
}

.main-container {
  height: 100vh;
  overflow-y: auto; /* 启用容器滚动 */
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.main-container::-webkit-scrollbar {
  width: 8px;
}

.main-container::-webkit-scrollbar-thumb {
  background: #F59E0B;
  border-radius: 10px;
}
```

### 智能滚动计算

网站实现了动态精确计算的滚动定位系统：

```javascript
const scrollToElement = (elementId) => {
    // 获取目标元素和滚动容器
    const targetElement = document.getElementById(elementId);
    const mainContainer = document.querySelector('.main-container');
    
    if (!targetElement || !mainContainer) return;

    // 计算所有影响滚动位置的因素
    // 1. 导航栏高度（动态获取）
    const navbar = document.querySelector('nav');
    const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 80;
    
    // 2. 计算目标元素相对于容器的准确位置
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = mainContainer.getBoundingClientRect();
    const currentScrollTop = mainContainer.scrollTop;
    const relativeTop = targetRect.top - containerRect.top + currentScrollTop;
    
    // 3. 根据不同部分调整额外偏移量
    let additionalOffset = elementId === 'about' ? 20 : 0;
    
    // 最终滚动位置计算
    const scrollToPosition = relativeTop - navbarHeight - additionalOffset;
    
    // 执行平滑滚动
    mainContainer.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
    });
};
```

这种实现方式具有以下优势：

1. 动态获取导航栏高度，适应不同设备和布局变化
2. 精确计算目标元素在滚动容器中的相对位置
3. 考虑当前滚动位置，确保滚动到正确的目标位置
4. 为不同部分设置独立的偏移量调整，优化视觉体验

### ICP备案信息

网站底部已添加了符合规范的ICP备案信息链接：

```jsx
<a 
  href="https://beian.miit.gov.cn/" 
  target="_blank" 
  rel="noopener noreferrer"
  className="hover:text-gray-400 transition-colors flex items-center"
>
  {/* 信息图标 */}
  辽ICP备2025051480号-1
</a>
```

备案信息链接到工信部备案管理系统网站，符合中国大陆网站备案要求。

### 课程管理规则

课表页面包含详细的课程须知和管理规则，包括：

- 课程预约规则：预约时间、取消方式和注意事项
- 课表执行说明：除特殊情况外严格按照课表时间上课
- 排课规则：各舞种领队可视情况私下排课，但不可影响正常课程
- 免费承诺：所有常规课程均免费，严禁私自收费
- 管理联系方式：提供管理部负责人联系方式，方便举报和咨询

这些规则确保了街舞社课程的有序进行和资源的公平分配。

## 用户认证系统

网站实现了完整的用户认证系统，支持以下功能：

- 用户注册：用户可以创建新账户，提供用户名、邮箱和密码
- 用户登录：已注册用户可以使用凭据登录系统
- 状态管理：使用React Context API管理全局用户状态
- 权限控制：基于登录状态动态显示/隐藏内容

认证系统具有以下特点：

1. 使用JWT（JSON Web Token）进行用户身份验证
2. 实现安全的密码处理和验证
3. 提供用户个人信息页面，可查看和管理个人资料
4. 根据用户登录状态显示不同的导航选项
5. 登录状态持久化，避免页面刷新后丢失登录状态

### 用户认证流程

```javascript
// AuthContext.tsx 核心代码片段
const login = async (username: string, password: string) => {
  try {
    setIsLoading(true);
    const response = await loginUser(username, password);
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: '登录失败' };
  } catch (error) {
    return { success: false, error: '登录时发生错误' };
  } finally {
    setIsLoading(false);
  }
};
```

## 课程预订系统

网站实现了课程预订系统，具有以下功能：

- 课程查看：显示街舞社所有课程的时间表
- 课程预订：登录用户可以预订空闲时段的课程
- 预订取消：用户可以取消已预订的课程
- 预订管理：在个人主页查看和管理所有已预订课程

课程系统具有以下特点：

1. 显示课程详细信息，包括课程名称、教练、地点和时间
2. 实时更新课程预订状态和剩余名额
3. 显示用户已预订课程，并提供取消选项
4. 未登录用户会被提示登录后才能预订课程
5. 课程容量限制，超出容量的课程无法预订
6. 可查看各时间段和星期几的课程安排表格

### 课程预订API集成

```javascript
// API集成代码片段
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch(`${API_URL}/courses`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const bookCourse = async (courseId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to book course');
    }
  } catch (error) {
    console.error('Error booking course:', error);
    throw error;
  }
};
```

## 目录结构

```
├── public/               # 静态资源
│   ├── images/           # 图片资源说明文件（实际图片存储在腾讯云COS）
├── src/                  # 源代码
│   ├── app/              # 页面
│   │   ├── page.tsx      # 首页
│   │   ├── schedule/     # 课程表页面
│   │   ├── auth/         # 认证相关页面
│   │   │   ├── login/    # 登录页面
│   │   │   └── register/ # 注册页面
│   │   ├── user/         # 用户相关页面
│   │   │   └── profile/  # 用户个人信息页面
│   │   └── layout.tsx    # 全局布局
│   ├── components/       # 组件
│   │   ├── Navbar.tsx    # 导航栏
│   │   ├── Footer.tsx    # 页脚（含ICP备案信息）
│   │   ├── Hero.tsx      # 首页大图展示（带动画效果）
│   │   ├── About.tsx     # 关于我们部分（带滚动动画和16:9横版图片四宫格展示）
│   │   └── ScheduleTable.tsx # 课程表组件（含课程须知和管理规则）
│   ├── context/          # 上下文
│   │   └── AuthContext.tsx # 用户认证上下文
│   ├── services/         # 服务
│   │   └── api.ts        # API调用服务
│   └── types/            # 类型定义
│       └── index.ts      # 全局类型定义
```

## 自定义和扩展

可以通过修改以下文件进行自定义：

- `src/app/globals.css` - 全局样式，包含自定义滚动条
- `src/components/` - 各个组件的样式和功能
- 腾讯云COS中的图片资源
- `next.config.ts` - Next.js配置，包括图片域名设置等
- `src/components/Footer.tsx` - 页脚信息，包括备案信息
- `src/components/ScheduleTable.tsx` - 课程表和课程管理规则
- `src/components/Hero.tsx` - 首页滚动逻辑和动画效果
- `src/context/AuthContext.tsx` - 用户认证逻辑
- `src/services/api.ts` - API服务调用

## 后端API集成

为完成完整的功能，网站需要与后端API进行集成，实现以下接口：

1. 用户认证API：
   - `/api/auth/register` - 用户注册
   - `/api/auth/login` - 用户登录
   - `/api/auth/logout` - 用户登出
   - `/api/users/me` - 获取当前用户信息

2. 课程管理API：
   - `/api/courses` - 获取所有课程
   - `/api/courses/{id}` - 获取单个课程详情
   - `/api/courses/{id}/book` - 预订课程
   - `/api/courses/{id}/cancel` - 取消课程预订
   - `/api/users/bookings` - 获取当前用户的预订

这些API端点应由后端服务提供，并与前端集成以实现完整功能。

## 前后端连接故障排查指南

如果前端无法连接到后端API，可以按照以下步骤进行排查：

### 1. 检查后端服务器状态

确认后端服务器是否正在运行，以及是否在正确的端口上：

```bash
# Windows
netstat -ano | findstr "5000"

# Linux/macOS
lsof -i :5000
```

### 2. 检查前端API配置

确认`src/services/api.ts`中的API基础URL配置正确：

```typescript
// 使用相对路径，依赖Next.js的API路由转发
const API_BASE_URL = '/api';
```

同时确认`next.config.ts`中的API路由转发配置正确：

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*', // 后端API地址
    },
  ];
}
```

### 3. 检查网络连接和CORS

- 使用浏览器开发者工具检查网络请求，查看是否有CORS错误
- 确认后端服务器已正确配置CORS，允许前端域名的请求
- 检查请求和响应头，确保Content-Type正确

### 4. 使用工具直接测试API

使用Postman或curl等工具直接测试后端API：

```bash
curl http://localhost:5000/api/courses
```

### 5. 检查控制台错误

查看浏览器控制台和服务器日志，寻找更详细的错误信息。

### 6. 排查常见React警告

修复React组件中的key警告，确保渲染列表时每个元素都有唯一的key属性。

### 7. 增加调试日志

在API调用前后添加调试日志，跟踪请求发送和响应接收过程。

## 动画效果

项目中包含以下动画效果：

1. Hero组件入场动画：标题、描述和按钮的渐入和上移效果
2. 社徽悬停动画：鼠标悬停时的放大和光晕效果
3. 背景图片缓慢缩放：随页面滚动产生视差效果
4. About部分的滚动入场动画：使用Intersection Observer检测元素进入视口
5. 图片悬停效果：鼠标悬停时的放大和阴影效果
6. 特色部分的错落动画：三个特色卡片依次显示的动画效果
7. 平滑滚动：点击导航按钮时平滑滚动到相应部分

## 数据接入

课程表数据当前使用模拟数据，后期可以通过以下方式接入真实数据：

1. 在`src/components/ScheduleTable.tsx`中修改API调用
2. 实现数据获取函数，从后端获取课程安排
3. 添加数据刷新机制，保持课程表更新

## API集成

### API服务结构

项目使用模块化的API服务结构，主要包含以下几个模块：

```typescript
// 认证相关API
authApi.login(email, password)
authApi.register(username, email, password)
authApi.getCurrentUser()

// 课程相关API
courseApi.getAllCourses()
courseApi.getCourseById(courseId)
courseApi.getCourseBookingStatus(courseId)

// 预订相关API
bookingApi.getUserBookings()
bookingApi.bookCourse(courseId)
bookingApi.cancelBooking(courseId)
bookingApi.getCourseBookingStatus(courseId)
bookingApi.getBatchBookingStatus(courseIds)

// 用户相关API
userApi.updateProfile(userData)
userApi.changePassword(currentPassword, newPassword)
```

### 预订状态管理

课程预订状态遵循以下流程：

1. 用户登录时，系统自动加载所有课程的预订状态
2. 预订状态分为三种：
   - `not_booked`: 未预订
   - `confirmed`: 已确认预订
   - `canceled`: 已取消预订
3. 用户预订或取消课程后，系统会自动更新对应课程的预订状态
4. 使用API `bookingApi.getBatchBookingStatus()` 可批量获取多个课程的预订状态，提高性能

### 后端API端点

系统与以下主要API端点交互：

- `/api/auth/login` - 用户登录
- `/api/auth/register` - 用户注册
- `/api/users/me` - 获取当前用户信息
- `/api/courses` - 获取所有课程
- `/api/bookings/user` - 获取用户的预订
- `/api/bookings/{courseId}` - 预订或取消课程
- `/api/users/booking-status/{courseId}` - 获取指定课程的预订状态

这些API端点应由后端服务提供，并与前端集成以实现完整功能。

## 课程管理规则

- 课程预订开放时间为每周日晚上8点至次周日晚上8点
- 每人每周最多可预订3节课程
- 如需取消预订，请至少提前24小时操作
- 无故缺席已预订课程三次，将被限制预订权限一个月
- 请携带学生证或社团卡参加课程

## 自定义滚动容器

项目使用自定义滚动容器和滚动指示器，具体设置如下：

```css
:root {
  --scrollbar-width: 8px;
  --scrollbar-track-color: rgba(0, 0, 0, 0.05);
  --scrollbar-thumb-color: rgba(0, 0, 0, 0.3);
}

body {
  overflow: hidden;
  margin: 0;
  padding: 0;
  height: 100vh;
}

#scroll-container {
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scroll-behavior: smooth;
}
```

滚动指示器通过 `ScrollIndicator` 组件实现，根据页面滚动位置动态显示当前位置标记。

## 更新日志

### 2025年04月05日
- 修复了预约人数显示错误的问题
  - 问题：发现后端返回的课程预约人数为0时，前端显示为1人的错误
  - 原因：在处理课程数据时，使用了`bookedCount || 0`的写法，这会导致当`bookedCount`为0时依然会被替换为0，看起来正常，但在后续预约操作中却会导致计算错误
  - 解决方案：修改了所有使用bookedCount的地方，使用`bookedCount !== undefined ? bookedCount : 0`的方式，确保0值被正确保留而不是被视为假值
  - 优化：重写了课程预约和取消预约时的状态更新逻辑，确保精确的人数计算
  - 改进：统一了所有数值处理方式，加强了代码健壮性，防止类似问题再次发生

### 2025年04月04日
- 进一步优化了课程预约操作的用户体验
  - 问题：预约或取消预约后，预约人数会出现跳动，显示不稳定
  - 原因：乐观更新UI与后续API刷新之间存在数据冲突，导致人数先改变后又被重新设置
  - 解决方案：采用纯乐观更新模式，去除API成功后的刷新操作，只在API失败时恢复原状态
  - 优化：增强了"刷新"按钮功能，使其成为唯一的全局数据同步入口，提供清晰的加载状态指示
  - 改进：在数据变更（预约/取消）与数据同步（刷新）之间建立明确的界限，避免混淆
- 优化了课程预约操作的用户体验
  - 问题：预约或取消预约课程后，通过重载所有课程数据导致页面闪烁，体验不佳
  - 解决方案：重构了`refreshSingleCourse`函数，改为只精确更新已操作课程的关键属性（如预约人数）
  - 优化：不再调用`loadCourses()`重载整个课程表，而是采用"模糊更新"方式，减少不必要的重新渲染
  - 改进：去除了不必要的错误提示，减少对用户的干扰，同时保留乐观UI更新策略
- 优化首页滚动条和视差效果
  - 修复首页滚动条不显示的问题
  - 优化Hero组件背景图片视差效果，实现滚动时平滑过渡
  - 背景图片跟随滚动位置缓慢移动，增强立体感
  - 增强了滚动条样式，确保在各种场景下均可见
  - 改进视觉层次结构，确保内容元素正确覆盖在背景上
  - 优化各组件间z-index关系，解决视觉重叠问题

### 2025年04月03日
- 修复了预约人数显示不正确的问题
  - 问题：用户在预约或取消预约课程后，课程表中的预约人数没有正确更新
  - 原因：之前的实现在预约操作后只更新单个课程的部分属性，没有重新获取完整的课程数据
  - 解决方案：修改了`refreshSingleCourse`函数，在预约/取消预约后直接调用`loadCourses`获取所有最新课程数据
  - 改进：统一了数据刷新逻辑，确保用户操作后能看到准确的预约人数，提高了数据一致性
- 优化Hero组件背景图片视觉效果
  - 将背景图片从"absolute"定位更改为"fixed"定位
  - 移除了背景图片的缩放动画效果，改为固定不动的视差效果
  - 当用户滚动页面时，内容会自然覆盖在背景图片上，增强沉浸感
  - 提高了页面滚动的流畅度，减少了不必要的动画计算
  - 增强了视觉层次感，使焦点更集中在内容上而非背景动画

### 2025年04月02日
- 修复了预约课程或取消预约后课程在课程表中消失的问题
  - 问题：用户在预约课程或取消预约后，该课程会从课程表中消失，导致无法看到课程信息
  - 原因：`refreshSingleCourse`函数在更新课程信息时，如果后端API返回的数据结构不完整，会导致课程属性丢失
  - 解决方案：重构了刷新课程数据的逻辑，确保只更新需要更改的属性，保留原有课程信息，特别是课程的时间槽等重要属性
  - 优化：改进了错误处理机制，即使API调用失败也不会导致课程消失，保证了用户体验的连续性
- 修复首页Hero组件的滚动定位问题
  - 重新设计了"了解更多"按钮的滚动定位算法
  - 导航栏底部现在会精确对齐Hero组件底部
  - 优化了滚动计算逻辑，使用Hero元素的实际高度计算
  - 修复了导航栏高度变化导致的对齐问题（从72px变为56px）
  - 采用固定导航栏高度(56px)进行计算，确保一致的视觉效果
  - 统一了滚动容器选择器，将scroll-container更改为main-container
  - 改进了导航栏滚动监听逻辑，确保与Hero组件的滚动设置一致
  - 增强了调试日志输出，便于跟踪滚动位置计算过程

### 2025年04月01日
- 修复了课程表刷新功能中使用了不存在的 `toast.info` 方法导致的运行时错误。
  - 问题：在点击刷新课程表时，出现 `Error: {imported module [project]/nodemodules/react-hot-toast/dist/index.mjs [app-client] (ecmascript)}.toast.info is not a function` 错误。
  - 解决方案：移除或替换了所有 `toast.info` 调用，因为当前版本的 react-hot-toast 库不支持此方法。

## 用户角色与权限系统

系统实现了三级用户角色管理，各角色具有不同的权限和功能：

### 1. 超级管理员 (admin)

- 具有系统最高权限
- 可以查看所有用户信息
- 可以按角色筛选用户
- 无需预约课程，可直接参加所有课程
- 管理系统配置和核心功能

### 2. 舞种领队 (leader)

- 具有特定舞种的管理权限
- 每个领队负责一个舞种类型（如Breaking、Popping等）
- 无需预约课程，可直接参加所有课程
- 可查看和管理自己负责的舞种信息
- 可以在系统中作为舞种的官方代表

### 3. 普通社员 (member)

- 基础用户权限
- 可以预约和取消课程
- 查看自己已预约的课程
- 浏览所有公开课程和舞种领队信息

### 预约课程权限

- 仅普通社员可以预约和取消课程
- 超级管理员和舞种领队无需预约即可参加课程
- 当舞种领队和超级管理员尝试预约课程时，系统会给予相应提示

### 舞种领队管理

系统提供公开的舞种领队查询功能：

- `/leaders` - 查看所有舞种的领队信息
- `/leaders/{danceType}` - 查看特定舞种的领队信息

这些页面对所有用户（包括未登录用户）可见，方便社员了解各舞种负责人信息。

### 用户管理

管理页面仅超级管理员可访问：

- `/admin/users` - 查看和管理所有用户
- 可按角色（admin/leader/member）筛选用户

## 测试账号

系统预设了不同角色的测试账号：

1. 超级管理员：
   - 用户名：admin
   - 密码：admin123

2. 舞种领队（Breaking）：
   - 用户名：bboy_leader
   - 密码：leader123

3. 舞种领队（Popping）：
   - 用户名：popping_leader
   - 密码：leader123

4. 普通社员：
   - 用户名：member1
   - 密码：member123
