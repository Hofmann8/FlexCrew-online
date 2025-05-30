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

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
        credentials: 'include' as RequestCredentials,
    };

    try {
        // 记录请求信息，便于调试
        const isCurrentUserRequest = endpoint === '/users/me';
        if (isCurrentUserRequest) {
            console.log('发送getCurrentUser请求，令牌:', token ? `${token.substring(0, 10)}...` : '无');
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (isCurrentUserRequest) {
            console.log('getCurrentUser响应状态:', response.status);
        }

        // 特殊处理401错误（未授权），可能是token过期
        if (response.status === 401) {
            // 判断是否是关键认证请求
            const isCriticalAuthRequest =
                isCurrentUserRequest ||
                endpoint.startsWith('/auth/') ||
                endpoint === '/users/profile';

            // 如果是刷新token的请求，不要尝试再次刷新，避免无限循环
            const isRefreshTokenRequest = endpoint === '/auth/refresh-token';

            // 如果是自动刷新认证请求，不要清除认证状态，避免首次加载时的不必要错误
            const isAutoRefreshRequest = endpoint === '/auth/auto-refresh';

            // 课程预订状态请求不应该导致登出
            const isBookingStatusRequest = endpoint.includes('/booking-status/');

            // 对于非刷新token和自动刷新请求的401错误，尝试刷新token
            if (!isRefreshTokenRequest && !isAutoRefreshRequest && !isBookingStatusRequest) {
                console.log('收到401错误，尝试刷新token...');
                try {
                    // 直接调用刷新token的API
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include' as RequestCredentials,
                    });

                    // 如果刷新成功
                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        if (refreshData.success && refreshData.data && refreshData.data.token) {
                            // 保存新token
                            const newToken = refreshData.data.token;
                            console.log('令牌刷新成功，使用新令牌重试请求');
                            localStorage.setItem('auth_token', newToken);

                            // 如果响应中有用户信息，也需要处理
                            if (refreshData.data.user) {
                                const userData = refreshData.data.user;
                                // 确保用户ID是字符串类型
                                if (userData.id !== null && userData.id !== undefined) {
                                    userData.id = String(userData.id);
                                }
                                localStorage.setItem('user_info', JSON.stringify(userData));
                            }

                            // 使用新token重试原始请求
                            const newHeaders = {
                                ...headers,
                                'Authorization': `Bearer ${newToken}`
                            };

                            const newConfig = {
                                ...options,
                                headers: newHeaders,
                                credentials: 'include' as RequestCredentials,
                            };

                            // 重试请求
                            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, newConfig);

                            // 如果重试成功，返回结果
                            if (retryResponse.ok) {
                                try {
                                    return await retryResponse.json();
                                } catch (e) {
                                    return { success: true };
                                }
                            }
                        }
                    }
                } catch (refreshError) {
                    console.error('刷新令牌失败:', refreshError);
                }
            }

            // 只有关键认证请求失败，且token刷新失败，且不是自动刷新请求，才清除认证状态并重定向
            if (isCriticalAuthRequest && !isBookingStatusRequest && !isAutoRefreshRequest) {
                // 如果在浏览器环境中，清除本地存储的认证信息
                if (typeof window !== 'undefined') {
                    console.warn('关键认证请求失败，清除令牌和用户信息');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');

                    // 避免在用户手动登出时重定向
                    if (endpoint !== '/auth/logout') {
                        // 可以添加重定向到登录页面的逻辑
                        window.location.href = '/auth/login';
                    }
                }
                throw new Error('认证失败，请重新登录');
            } else {
                console.warn(`非关键请求的401错误: ${endpoint}，不清除认证状态`);
                // 对于非关键请求，仅返回错误，不清除认证状态
                return { success: false, message: '请求未授权', status: 401 };
            }
        }

        // 克隆响应用于日志查看（因为响应体只能被读取一次）
        const responseClone = response.clone();

        // 尝试解析响应为JSON
        try {
            const data = await response.json();

            if (isCurrentUserRequest) {
                console.log('getCurrentUser响应内容:', data);
            }

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (jsonError) {
            // 如果是获取当前用户信息的请求，记录详细错误
            if (isCurrentUserRequest) {
                console.error('解析getCurrentUser响应出错:', jsonError);

                // 尝试获取响应文本
                try {
                    const textResponse = await responseClone.text();
                    console.log('getCurrentUser响应文本:', textResponse);
                } catch (textError) {
                    console.error('读取响应文本失败:', textError);
                }
            }

            // 如果解析JSON失败但响应成功，返回简单对象
            if (response.ok) {
                return { success: true };
            }
            throw new Error('无法解析响应数据');
        }
    } catch (error) {
        console.error(`API请求失败: ${endpoint}`, error);
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
    register: async (username: string, name: string, email: string, password: string) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, name, email, password }),
        });
    },

    // 验证邮箱
    verifyEmail: async (userId: number, code: string) => {
        return apiRequest('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ userId, code }),
        });
    },

    // 重新发送验证码
    resendVerification: async (email: string) => {
        return apiRequest('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // 忘记密码 - 发送重置验证码
    forgotPassword: async (email: string) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // 重置密码 - 验证并修改密码
    resetPassword: async (userId: number, code: string, newPassword: string) => {
        return apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ userId, code, newPassword }),
        });
    },

    // 获取当前用户信息
    getCurrentUser: async () => {
        return apiRequest('/users/me');
    },

    // 刷新token
    refreshToken: async () => {
        console.log('调用刷新token API');
        return apiRequest('/auth/refresh-token', {
            method: 'POST',
        });
    },

    // 自动刷新认证
    autoRefresh: async () => {
        console.log('调用自动刷新认证API');
        return apiRequest('/auth/auto-refresh', {
            method: 'GET',
        });
    },

    // 标准登出流程
    logout: async () => {
        console.log('调用标准登出API');
        return apiRequest('/auth/logout', {
            method: 'POST',
        });
    }
};

// 课程相关API
export const courseApi = {
    // 获取所有课程
    getAllCourses: async () => {
        return apiRequest('/courses');
    },

    // 获取指定日期所在周的课程安排
    getWeekSchedule: async (date?: string) => {
        const queryString = date ? `?date=${date}` : '';
        console.log('请求周课程表API，参数日期:', date);
        try {
            const response = await apiRequest(`/schedule${queryString}`);
            console.log('周课程表API响应:', response);
            return response;
        } catch (error) {
            console.error('获取周课程表失败:', error);
            throw error;
        }
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
        const statusPromises = courseIds.map(id => courseApi.getCourseBookingStatus(id));
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
        try {
            console.log('调用获取用户预约记录API');
            const response = await apiRequest('/bookings/user');
            console.log('获取用户预约记录API响应:', response);

            // 处理响应数据
            if (response && response.success && Array.isArray(response.data)) {
                return response.data;
            } else if (response && Array.isArray(response)) {
                return response;
            } else {
                console.error('无法解析API响应格式:', response);
                return [];
            }
        } catch (error) {
            console.error('获取用户预约记录出错:', error);
            throw error;
        }
    },

    // 预订课程 - 更新为正确的API路径
    bookCourse: async (courseId: string) => {
        return apiRequest(`/courses/${courseId}/book`, {
            method: 'POST',
        });
    },

    // 取消预订 - 更新为正确的API路径
    cancelBooking: async (courseId: string) => {
        try {
            console.log(`调用取消预订API, 课程ID: ${courseId}`);
            const response = await apiRequest(`/courses/${courseId}/cancel`, {
                method: 'DELETE',
            });
            console.log('取消预订API响应:', response);

            // 修改判断逻辑：HTTP 200响应码就视为成功，即使响应体可能为空或不包含success字段
            // 如果response存在且有success字段，使用该字段；否则，HTTP 200响应码就意味着成功
            return response === undefined ? true : (response.success ?? true);
        } catch (error) {
            console.error('取消预订出错:', error);
            throw error;
        }
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
    // 获取所有用户（仅限管理员）
    getAllUsers: async () => {
        try {
            console.log('调用获取所有用户API');
            const response = await apiRequest('/users');
            console.log('获取所有用户API响应:', response);
            return response;
        } catch (error) {
            console.error('获取所有用户出错:', error);
            throw error;
        }
    },

    // 按角色获取用户（仅限管理员）
    getUsersByRole: async (role: 'admin' | 'leader' | 'member') => {
        try {
            console.log(`调用获取${role}角色用户API`);
            const response = await apiRequest(`/users/role/${role}`);
            console.log(`获取${role}角色用户API响应:`, response);
            return response;
        } catch (error) {
            console.error(`获取${role}角色用户出错:`, error);
            throw error;
        }
    },

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

    // 创建新用户（仅限管理员）
    createUser: async (userData: any) => {
        return apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // 更新用户角色和舞种（仅限管理员）
    updateUserRole: async (userId: string, data: { role?: string, dance_type?: string, danceType?: string }) => {
        // 确保使用后端API要求的字段名
        console.log('更新用户角色和舞种，原始数据:', data);

        // 深拷贝数据对象，避免修改原始对象
        const apiData = { ...data };

        // 确保发送dance_type
        if (data.danceType && !data.dance_type) {
            apiData.dance_type = data.danceType;
        }

        console.log('发送给API的数据:', apiData);

        return apiRequest(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify(apiData),
        });
    },

    // 删除用户（仅限管理员）
    deleteUser: async (userId: string) => {
        return apiRequest(`/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // 获取特定舞种的成员列表
    getUsersByDanceType: async (danceType: string) => {
        return apiRequest(`/users/dance-type/${danceType}`);
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

// 课程管理API（管理员和领队）
export const adminCourseApi = {
    // 获取管理的课程列表
    getAllCourses: async () => {
        return apiRequest('/admin/courses');
    },

    // 创建新课程
    createCourse: async (courseData: any) => {
        return apiRequest('/admin/courses', {
            method: 'POST',
            body: JSON.stringify(courseData),
        });
    },

    // 更新课程信息
    updateCourse: async (courseId: string, courseData: any) => {
        return apiRequest(`/admin/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseData),
        });
    },

    // 删除课程
    deleteCourse: async (courseId: string) => {
        return apiRequest(`/admin/courses/${courseId}`, {
            method: 'DELETE',
        });
    },

    // 获取课程分配情况（仅限管理员）
    getCourseAssignments: async () => {
        return apiRequest('/admin/courses/assignments');
    },

    // 分配课程归属（仅限管理员）
    assignCourse: async (courseId: string, assignmentData: { danceType: string, leaderId: string | null }) => {
        return apiRequest(`/admin/courses/${courseId}/assign`, {
            method: 'PUT',
            body: JSON.stringify(assignmentData),
        });
    }
};

// 合并所有API服务
export const api = {
    auth: authApi,
    courses: courseApi,
    bookings: bookingApi,
    users: userApi,
    leaders: leaderApi,
    adminCourses: adminCourseApi
};

export default api; 