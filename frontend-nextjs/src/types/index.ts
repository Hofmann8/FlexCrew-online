// 用户相关类型
export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'member' | 'leader' | 'admin';
    dance_type?: string;
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
    weekday: string;
    timeSlot: string;
    originalTimeSlot?: string; // 原始时间段，用于显示
    maxCapacity: number;
    bookedCount?: number; // 当前预订人数
    bookedBy: string[];
    description?: string;
    dance_type?: string;
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

// 课程时间槽
export const TIME_SLOTS = [
    '09:00-10:00',
    '10:00-11:00',
    '14:00-15:00',
    '15:00-16:00',
    '19:00-20:00',
    '20:00-21:00'
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

// 认证上下文类型
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    register: (username: string, email: string, password: string) => Promise<boolean>;
}

// API 响应类型
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    status?: number;
} 