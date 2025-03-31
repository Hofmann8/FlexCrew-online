// API服务
const API_BASE_URL = '/api';

// 辅助函数 - 获取存储的认证令牌
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token');
    }
    return null;
};

// 基础请求函数
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // 处理401错误（未授权），可能是token过期
        if (response.status === 401) {
            // 如果在浏览器环境中，清除本地存储的认证信息
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                // 可以添加重定向到登录页面的逻辑
                window.location.href = '/auth/login';
            }
            throw new Error('认证失败，请重新登录');
        }

        // 克隆响应用于日志查看（因为响应体只能被读取一次）
        const responseClone = response.clone();

        // 尝试解析响应为JSON
        try {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (jsonError) {
            // 如果解析JSON失败但响应成功，返回简单对象
            if (response.ok) {
                return { success: true };
            }
            throw new Error('无法解析响应数据');
        }
    } catch (error) {
        throw error;
    }
};

// 认证相关API
export const authApi = {
    // 用户登录
    login: async (username: string, password: string) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    // 用户注册
    register: async (username: string, email: string, password: string) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    },

    // 获取当前用户信息
    getCurrentUser: async () => {
        return apiRequest('/users/me');
    }
};

// 课程相关API
export const courseApi = {
    // 获取所有课程
    getAllCourses: async () => {
        return apiRequest('/courses');
    },

    // 刷新获取指定课程的最新信息，包括预约人数
    refreshCourseInfo: async (courseId: string) => {
        return apiRequest(`/courses/${courseId}`);
    },

    // 获取特定课程详情
    getCourseById: async (courseId: string) => {
        return apiRequest(`/courses/${courseId}`);
    },

    // 获取课程预订状态
    getCourseBookingStatus: async (courseId: string) => {
        return apiRequest(`/users/booking-status/${courseId}`);
    },

    // 获取所有课程的预订状态
    getAllCoursesBookingStatus: async (courseIds: string[]) => {
        // 可以通过批量API或循环单个API实现
        const statusPromises = courseIds.map(id => this.getCourseBookingStatus(id));
        const statuses = await Promise.all(statusPromises);

        // 返回一个以courseId为键，status为值的对象
        return courseIds.reduce((acc, id, index) => {
            acc[id] = statuses[index].status;
            return acc;
        }, {} as Record<string, string>);
    }
};

// 预订相关API
export const bookingApi = {
    // 获取用户的所有预订
    getUserBookings: async () => {
        return apiRequest('/bookings/user');
    },

    // 预订课程 - 更新为正确的API路径
    bookCourse: async (courseId: string) => {
        return apiRequest(`/courses/${courseId}/book`, {
            method: 'POST',
        });
    },

    // 取消预订 - 更新为正确的API路径
    cancelBooking: async (courseId: string) => {
        return apiRequest(`/courses/${courseId}/cancel`, {
            method: 'DELETE',
        });
    },

    // 获取特定课程的预订状态
    getCourseBookingStatus: async (courseId: string) => {
        return apiRequest(`/users/booking-status/${courseId}`);
    },

    // 批量获取多个课程的预订状态
    getBatchBookingStatus: async (courseIds: string[]) => {
        if (!courseIds || courseIds.length === 0) {
            return {};
        }

        // 去重，避免重复请求相同ID
        const uniqueIds = [...new Set(courseIds)];
        const statuses: Record<string, string> = {};

        // 使用Promise.all并行请求所有状态
        await Promise.all(
            uniqueIds.map(async (id) => {
                try {
                    const result = await apiRequest(`/users/booking-status/${id}`);

                    // 处理不同的响应格式
                    let status = 'not_booked'; // 默认未预约

                    if (result && result.data && result.data.status) {
                        // 标准格式: { success: true, data: { status: "confirmed" } }
                        status = result.data.status;
                    } else if (result && result.status) {
                        // 旧格式: { status: "confirmed" }
                        status = result.status;
                    } else if (typeof result === 'string') {
                        // 直接字符串格式
                        status = result;
                    }

                    // 确保状态是有效的值 (confirmed, canceled, not_booked)
                    if (!['confirmed', 'canceled', 'not_booked', 'pending'].includes(status)) {
                        status = 'not_booked';
                    }

                    statuses[id] = status;
                } catch (error) {
                    // 发生错误时默认为未预订状态
                    statuses[id] = 'not_booked';
                }
            })
        );

        return statuses;
    }
};

// 用户相关API
export const userApi = {
    // 更新用户资料
    updateProfile: async (userData: any) => {
        return apiRequest('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    },

    // 更改密码
    changePassword: async (currentPassword: string, newPassword: string) => {
        return apiRequest('/users/password', {
            method: 'PATCH',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    // 获取所有用户（仅限管理员）
    getAllUsers: async () => {
        return apiRequest('/users');
    },

    // 按角色获取用户（仅限管理员）
    getUsersByRole: async (role: 'admin' | 'leader' | 'member') => {
        return apiRequest(`/users/role/${role}`);
    }
};

// 舞种领队相关API
export const leaderApi = {
    // 获取所有舞种领队
    getAllLeaders: async () => {
        return apiRequest('/leaders');
    },

    // 获取特定舞种的领队
    getLeadersByDanceType: async (danceType: string) => {
        return apiRequest(`/leaders/${danceType}`);
    }
};

// 导出所有API服务
export default {
    auth: authApi,
    courses: courseApi,
    bookings: bookingApi,
    users: userApi,
    leaders: leaderApi,
}; 