// 用户相关类型
export interface User {
    // 用户ID，为了与JWT兼容，始终应当转换为字符串类型
    id: string;
    username: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'member' | 'leader' | 'admin';
    dance_type?: string;
    danceType?: string; // 新增字段，与新后端API保持一致
    emailVerified?: boolean;
    canBookCourse?: boolean;
}

// 登录请求和响应
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

// 课程相关类型
export interface Course {
    id: string;
    name: string;
    instructor: string;
    location: string;
    weekday: string;  // 由后端计算得出，保留兼容性
    timeSlot: string; // 格式: "HH:MM-HH:MM"，例如 "09:00-10:30"
    maxCapacity: number;
    bookedCount?: number; // 当前预订人数
    bookedBy: string[];
    description?: string;
    dance_type?: string;
    danceType?: string; // 与后端接口保持一致
    leaderId?: string; // 与后端接口保持一致
    courseDate?: string; // 新增字段，课程具体日期，格式：YYYY-MM-DD
}

// 创建/更新课程请求
export interface CourseFormData {
    name: string;
    instructor: string;
    location: string;
    courseDate: string; // 修改为使用具体日期，替代weekday
    timeSlot: string; // 格式: "HH:MM-HH:MM"
    maxCapacity: number;
    description: string;
    danceType?: string;
    leaderId?: string;
}

// 课程分配信息
export interface CourseAssignment {
    leaderId?: string;
    leaderName?: string;
    danceType: string;
    courseCount: number;
}

// 预约相关类型
export interface Booking {
    id: string;
    userId: string;
    courseId: string;
    status: BookingStatus;
    createdAt: string;
    updatedAt: string;
    course?: Course;
}

// 预约请求和响应
export interface BookingRequest {
    courseId: string;
}

export interface BookingResponse {
    booking: Booking;
    message: string;
}

// 验证结果类型
export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

// 预订状态枚举
export type BookingStatus = 'not_booked' | 'confirmed' | 'canceled';

// 预订状态映射类型，用于缓存课程预订状态
export interface BookingStatusMap {
    [courseId: string]: BookingStatus;
}

// 课程时间槽 - 预设选项，但用户可以自定义任意时间
export const TIME_SLOTS = [
    '08:00-09:00',
    '08:30-10:00',
    '09:00-10:00',
    '09:00-10:30',
    '10:00-11:00',
    '10:30-12:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '13:30-15:00',
    '14:00-15:00',
    '14:00-15:30',
    '15:00-16:00',
    '15:30-17:00',
    '16:00-17:00',
    '17:00-18:00',
    '17:30-19:00',
    '18:00-19:00',
    '18:00-19:30',
    '19:00-20:00',
    '19:00-20:30',
    '19:30-21:00',
    '20:00-21:00',
    '20:00-21:30',
    '21:00-22:00'
];

// 星期几
export const WEEKDAYS = [
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
    '星期日'
];

// 舞种类型
export const DANCE_TYPES = [
    'breaking',
    'popping',
    'locking',
    'hiphop',
    'house',
    'public' // 公共课程
];

// 注册响应类型
export interface RegisterResponse {
    userId: number;
    email: string;
    emailVerified: boolean;
}

// 邮箱验证响应类型
export interface VerifyEmailResponse {
    user: User;
    token: string;
}

// 认证上下文类型
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean | { userId: number, email: string, emailVerified: false }>;
    logout: () => void;
    register: (username: string, name: string, email: string, password: string) => Promise<RegisterResponse | null>;
    verifyEmail: (userId: number, code: string) => Promise<boolean>;
    resendVerification: (email: string) => Promise<boolean>;
    refreshUser: () => Promise<boolean>;
    refreshToken: () => Promise<boolean>;
}

// API 响应类型
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    status?: number;
} 