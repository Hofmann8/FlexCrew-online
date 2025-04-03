"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingApi, courseApi } from '@/services/api';
import { Course } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiRefreshCw, FiAlertCircle, FiCheck, FiX, FiClock, FiMapPin, FiUser, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// 周几名称
const weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

// 星期和时间槽的映射，用于转换API返回的格式
const weekdayMap: Record<string, string> = {
    'Monday': '星期一',
    'Tuesday': '星期二',
    'Wednesday': '星期三',
    'Thursday': '星期四',
    'Friday': '星期五',
    'Saturday': '星期六',
    'Sunday': '星期日',
    // 已经是中文的情况，直接保持一致
    '星期一': '星期一',
    '星期二': '星期二',
    '星期三': '星期三',
    '星期四': '星期四',
    '星期五': '星期五',
    '星期六': '星期六',
    '星期日': '星期日'
};

// 日期格式化辅助函数
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 获取一周的开始日期（星期一）
const getWeekStartDate = (date: Date): Date => {
    const day = date.getDay() || 7; // 将周日的0转换为7
    const diff = date.getDate() - day + 1; // 调整为星期一
    return new Date(date.setDate(diff));
};

// 获取一周的日期数组
const getWeekDates = (startDate: Date): Date[] => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
    }
    return dates;
};

// 格式化日期为YYYY-MM-DD
const formatDateYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 预订状态接口
interface BookingStatusMap {
    [courseId: string]: string; // 'not_booked', 'confirmed', 'canceled'
}

// 周课程数据接口
interface WeekSchedule {
    [date: string]: Course[];
}

// 将时间字符串转换为分钟数（从00:00开始）
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// 解析时间段字符串（如 "09:00-10:30"）为开始和结束时间的分钟数
const parseTimeSlot = (timeSlot: string): { start: number; end: number } => {
    const [start, end] = timeSlot.split('-');
    return {
        start: timeToMinutes(start),
        end: timeToMinutes(end)
    };
};

// 分钟数转回时间字符串
const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// 添加自定义CSS类用于控制滚动条和溢出
const scheduleTableStyles = {
    tableContainer: 'overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white',
    scrollContainer: 'scrollbar-hide overflow-x-auto',
    weekdayColumn: 'min-w-[150px] flex-shrink-0 border-r border-gray-100 last:border-r-0',
    fixedHeight: '',
    headerSticky: `
        sticky top-0 z-10
        bg-yellow-50 
        text-yellow-800
        font-medium
        border-b border-yellow-100
        h-20 flex flex-col items-center justify-center
    `,
    timeLabels: `
        text-xs text-right pr-2 text-gray-500
        border-r border-gray-100
    `,
    timeLabel: `
        absolute right-2 transform -translate-y-1/2
    `,
    hourLabel: `
        font-medium
    `,
    halfHourLabel: `
        text-gray-400 text-[10px]
    `,
    timeGridLine: `
        absolute left-0 right-0 border-t
    `,
    hourGridLine: `
        border-gray-200
    `,
    halfHourGridLine: `
        border-gray-100 border-dashed
    `,
    courseCard: `
        absolute left-1 right-1 
        rounded-md shadow-sm border
        p-2 overflow-hidden
        transition-all duration-200
        hover:shadow-md
    `
};

const ScheduleTable = () => {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStartDate, setWeekStartDate] = useState(getWeekStartDate(new Date()));
    const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({});
    const [bookingStatus, setBookingStatus] = useState<BookingStatusMap>({});
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loadingCourseId, setLoadingCourseId] = useState<string>('');
    // 添加防抖标记，避免重复发送请求
    const [isProcessingRequest, setIsProcessingRequest] = useState(false);
    // 添加课程列表状态变量
    const [courses, setCourses] = useState<Course[]>([]);

    // 计算当前周的日期
    const weekDates = useMemo(() => {
        const startDate = getWeekStartDate(selectedDate);
        return getWeekDates(startDate);
    }, [selectedDate]);

    // 判断当前显示的是否为本周
    const isCurrentWeek = useMemo(() => {
        const today = new Date();
        const currentWeekStartDate = getWeekStartDate(today);
        const displayWeekStartDate = getWeekStartDate(selectedDate);

        return formatDateYYYYMMDD(currentWeekStartDate) === formatDateYYYYMMDD(displayWeekStartDate);
    }, [selectedDate]);

    // 时间范围计算 - 找出所有课程中最早的开始时间和最晚的结束时间
    const { timeRange, minTime, maxTime } = useMemo(() => {
        if (courses.length === 0) {
            return {
                timeRange: [],
                minTime: timeToMinutes('09:00'),
                maxTime: timeToMinutes('22:00')
            };
        }

        let min = timeToMinutes('23:59');
        let max = timeToMinutes('00:00');

        courses.forEach(course => {
            if (!course.timeSlot) return;

            try {
                const { start, end } = parseTimeSlot(course.timeSlot);
                min = Math.min(min, start);
                max = Math.max(max, end);
            } catch (e) {
                console.warn('无法解析时间段:', course.timeSlot);
            }
        });

        // 时间范围向下取整到半小时，向上取整到半小时
        min = Math.floor(min / 30) * 30;
        max = Math.ceil(max / 30) * 30;

        // 生成时间刻度（每30分钟一个）
        const timeLabels = [];
        for (let time = min; time <= max; time += 30) {
            timeLabels.push(minutesToTime(time));
        }

        return { timeRange: timeLabels, minTime: min, maxTime: max };
    }, [courses]);

    useEffect(() => {
        loadWeekSchedule();
        console.log('切换到新的周，起始日期:', formatDateYYYYMMDD(weekDates[0]));
    }, [selectedDate]);

    useEffect(() => {
        // 只有在用户已登录且课程列表非空时，才加载预约状态
        if (isAuthenticated && courses.length > 0) {
            loadAllBookingStatuses();
        } else if (!isAuthenticated) {
            // 用户未登录时，清空预约状态
            setBookingStatus({});
        }
    }, [isAuthenticated, courses]);

    // 添加API错误信息显示组件
    const DisplayApiError = ({ error }: { error: string | null }) => {
        if (!error) return null;

        // 使用toast显示错误，而不是渲染组件
        React.useEffect(() => {
            if (error) {
                toast.error(error, {
                    position: 'top-center',
                    duration: 5000
                });
            }
        }, [error]);

        return null;
    };

    // 加载周视图课程
    const loadWeekSchedule = async () => {
        try {
            // 如果是通过预约/取消预约触发的重新加载，不要显示大的加载指示器
            const isRefreshingData = isProcessingRequest;
            if (!isRefreshingData) {
                setIsLoading(true);
            }
            setApiError(null);
            setIsProcessingRequest(true);

            // 使用当前周的起始日期
            const startDate = formatDateYYYYMMDD(weekDates[0]);
            console.log('请求周起始日期:', startDate);
            const scheduleResponse = await courseApi.getWeekSchedule(startDate);
            console.log('获取到的课程表数据:', scheduleResponse);

            if (scheduleResponse.success && scheduleResponse.data) {
                // 处理API返回的周课程数据
                const processedSchedule: WeekSchedule = {};

                // 检查数据结构是否包含schedule数组
                if (scheduleResponse.data.schedule && Array.isArray(scheduleResponse.data.schedule)) {
                    // 新的数据结构处理: { schedule: [{ date, courses: [] }] }
                    scheduleResponse.data.schedule.forEach((dayData: any) => {
                        const date = dayData.date;
                        const dayCourses = dayData.courses || [];

                        // 过滤有效的课程数据
                        const validCourses = dayCourses
                            .filter((course: any) => course && course.id && String(course.id) !== 'undefined')
                            .map((course: any) => ({
                                ...course,
                                id: String(course.id),
                                bookedBy: Array.isArray(course.bookedBy) ? course.bookedBy : [],
                                instructor: course.instructor || '未知教练',
                                maxCapacity: course.maxCapacity || 20,
                                location: course.location || '未指定地点',
                                timeSlot: course.timeSlot || '未指定时间',
                                courseDate: course.courseDate || date,
                                // 直接使用后端返回的bookedCount字段，不再通过bookedBy长度计算
                                bookedCount: course.bookedCount !== undefined ? course.bookedCount : 0
                            }));

                        processedSchedule[date] = validCourses;
                    });
                } else {
                    // 兼容旧的数据结构处理: { date: courses[] }
                    Object.entries(scheduleResponse.data).forEach(([date, dayCourses]) => {
                        // 确保dayCourses是一个数组
                        if (Array.isArray(dayCourses)) {
                            // 过滤有效的课程数据
                            const validCourses = dayCourses
                                .filter(course => course && course.id && String(course.id) !== 'undefined')
                                .map(course => ({
                                    ...course,
                                    id: String(course.id),
                                    bookedBy: Array.isArray(course.bookedBy) ? course.bookedBy : [],
                                    instructor: course.instructor || '未知教练',
                                    maxCapacity: course.maxCapacity || 20,
                                    location: course.location || '未指定地点',
                                    timeSlot: course.timeSlot || '未指定时间',
                                    courseDate: course.courseDate || date,
                                    // 直接使用后端返回的bookedCount字段，不再通过bookedBy长度计算
                                    bookedCount: course.bookedCount !== undefined ? course.bookedCount : 0
                                }));

                            processedSchedule[date] = validCourses;
                        } else {
                            processedSchedule[date] = [];
                        }
                    });
                }

                console.log('处理后的课程表数据:', processedSchedule);
                setWeekSchedule(processedSchedule);

                // 将所有课程合并到一个数组中，用于计算时间范围
                const allCourses: Course[] = [];
                Object.values(processedSchedule).forEach(dayCourses => {
                    allCourses.push(...dayCourses);
                });

                console.log('所有课程数据:', allCourses);
                setCourses(allCourses);

                // 如果是刷新数据，显示成功提示
                if (isRefreshingData) {
                    toast.success('数据已更新', {
                        position: 'top-center',
                        duration: 1500
                    });
                }
            } else {
                throw new Error('获取课程表数据失败');
            }
        } catch (err: any) {
            console.error('加载课程表错误:', err);
            const errorMessage = err.message || '加载课程失败，请刷新页面重试';
            setApiError(errorMessage);
        } finally {
            setIsLoading(false);
            setIsProcessingRequest(false);
        }
    };

    // 兼容性方法 - 如果后端未就绪，仍使用旧方法获取课程
    const loadCourses = async () => {
        try {
            setIsLoading(true);
            setApiError(null);
            setIsProcessingRequest(true);

            const coursesResponse = await courseApi.getAllCourses();

            // 处理嵌套的数据结构
            let coursesData;
            if (coursesResponse.data && Array.isArray(coursesResponse.data)) {
                coursesData = coursesResponse.data;
            } else if (Array.isArray(coursesResponse)) {
                coursesData = coursesResponse;
            } else {
                throw new Error('获取课程数据失败：返回数据格式不正确');
            }

            // 处理并标准化课程数据，确保格式一致
            const normalizedCourses: Course[] = coursesData.map((course: any) => {
                if (!course) return null;

                return {
                    ...course,
                    // 确保ID是字符串
                    id: String(course.id || ''),
                    // 标准化weekday格式
                    weekday: weekdayMap[course.weekday] || course.weekday || '未知',
                    // 确保bookedBy是数组
                    bookedBy: Array.isArray(course.bookedBy) ? course.bookedBy : [],
                    // 如果没有instructor字段但有teacher字段，使用teacher
                    instructor: course.instructor || course.teacher || '未知教练',
                    // 保存原始timeSlot
                    timeSlot: course.timeSlot || course.time || '未知时间',
                    // 确保maxCapacity有值
                    maxCapacity: course.maxCapacity || 20,
                    // 直接使用后端返回的bookedCount字段，不再通过bookedBy长度计算
                    bookedCount: course.bookedCount !== undefined ? course.bookedCount : 0
                };
            }).filter(Boolean);

            // 使用过渡动画更新状态
            setTimeout(() => {
                setCourses(normalizedCourses);
                setIsProcessingRequest(false);
            }, 300);
        } catch (err: any) {
            const errorMessage = err.message || '加载课程失败，请刷新页面重试';
            setApiError(errorMessage);
            setIsProcessingRequest(false);
        } finally {
            setIsLoading(false);
        }
    };

    // 加载所有课程的预订状态
    const loadAllBookingStatuses = async () => {
        if (!isAuthenticated || courses.length === 0) {
            return;
        }

        try {
            // 获取所有课程的ID
            const courseIds = courses
                .filter(course => course && course.id && course.id !== 'undefined' && course.id.trim() !== '')
                .map(course => course.id);

            // 如果没有有效的课程ID，直接返回
            if (courseIds.length === 0) {
                console.log('没有找到有效的课程ID，无法获取预订状态');
                return;
            }

            // 打印日志，便于调试
            console.log('正在获取课程预订状态，课程ID:', courseIds);

            // 批量获取所有课程的预订状态
            const statuses = await bookingApi.getBatchBookingStatus(courseIds);

            // 检查返回的数据格式
            if (!statuses || typeof statuses !== 'object') {
                // 创建一个默认的空状态对象
                const defaultStatuses = courseIds.reduce((acc, id) => {
                    acc[id] = 'not_booked';
                    return acc;
                }, {} as Record<string, string>);
                setBookingStatus(defaultStatuses);
                return;
            }

            // 处理返回的预约状态
            // 如果有data属性，使用data属性中的数据
            if (statuses.data && typeof statuses.data === 'object') {
                setBookingStatus(statuses.data);
            } else {
                // 直接使用返回的对象
                setBookingStatus(statuses);
            }
        } catch (error) {
            console.error('加载预约状态失败:', error);
            setApiError('加载预约状态失败，请刷新页面重试');
        }
    };

    // 添加一个手动刷新功能
    const handleRefresh = async () => {
        // 如果已经在刷新中，不重复操作
        if (isProcessingRequest) return;

        setIsProcessingRequest(true);
        // 添加清晰的提示，表明正在同步数据
        toast.success('正在从服务器同步最新数据...', {
            position: 'top-center',
            duration: 1500
        });

        try {
            // 获取最新的课程数据
            await loadWeekSchedule();

            // 如果用户已登录，同时更新预约状态
            if (isAuthenticated) {
                await loadAllBookingStatuses();
            }
        } catch (error) {
            // 刷新失败的提示
            toast.error('数据同步失败，请重试。', {
                position: 'top-center',
                duration: 2000
            });
        }
    };

    // 刷新单个课程的预约状态
    const refreshSingleCourse = async (courseId: string) => {
        // 确保courseId是有效的字符串，不是undefined或"undefined"
        if (!isAuthenticated || !courseId || courseId === 'undefined') {
            console.warn('无法刷新预约状态：无效的课程ID或用户未登录', courseId);
            return;
        }

        try {
            console.log(`正在刷新课程ID=${courseId}的预约状态`);

            // 使用getCourseBookingStatus获取课程预约状态
            const status = await bookingApi.getCourseBookingStatus(courseId);

            // 处理可能的401未授权响应
            if (status && typeof status === 'object' && (status.status === 401 || status.status === '401')) {
                console.log(`获取课程ID=${courseId}的预订状态未授权，用户可能需要登录`);
                // 设置为默认的未预约状态而不是抛出错误
                setBookingStatus(prev => ({
                    ...prev,
                    [courseId]: 'not_booked'
                }));
                return;
            }

            // 更新状态
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: status || 'not_booked'
            }));
        } catch (error) {
            console.error(`刷新课程ID=${courseId}的预约状态失败:`, error);
            // 设置为默认的未预约状态
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: 'not_booked'
            }));
        }
    };

    // 检查用户是否可以预定课程
    const canUserBookCourse = (): boolean => {
        // 用户必须已登录且不是管理员（管理员不能预约课程）
        return isAuthenticated && user?.role !== 'admin';
    };

    // 处理课程预约
    const handleBooking = async (courseId: string, courseName: string) => {
        // 如果用户未登录，提示登录
        if (!isAuthenticated) {
            toast.error('请先登录才能预约课程', {
                position: 'top-center',
                duration: 3000
            });
            return;
        }

        // 如果正在加载，不执行操作
        if (loadingCourseId === courseId) return;

        // 设置当前正在操作的课程ID
        setLoadingCourseId(courseId);

        try {
            // 调用预约API
            const bookingResponse = await bookingApi.bookCourse(courseId);

            // 检查API响应是否成功
            if (bookingResponse && bookingResponse.success) {
                // 预约成功
                toast.success(`成功预约课程: ${courseName}`, {
                    position: 'top-center',
                    duration: 3000
                });

                // 更新此课程的预约状态 - 无论是普通预约还是重新预约，都设置为confirmed
                setBookingStatus(prev => ({
                    ...prev,
                    [courseId]: 'confirmed'
                }));

                // 重新加载课程表数据以更新预约人数
                await loadWeekSchedule();
            } else {
                // 预约失败，但API返回了响应
                const errorMessage = bookingResponse?.message || '预约失败，请稍后重试';
                toast.error(errorMessage, {
                    position: 'top-center',
                    duration: 3000
                });
            }
        } catch (error: any) {
            // 捕获网络错误或其他异常
            console.error('预约课程错误:', error);
            const errorMessage = error.message || '预约课程时发生错误，请重试';
            toast.error(`预约失败: ${errorMessage}`, {
                position: 'top-center',
                duration: 3000
            });
        } finally {
            // 完成加载状态
            setLoadingCourseId('');
        }
    };

    // 防抖函数：防止短时间内多次重复请求
    const debounceRequest = (fn: Function, delay: number = 500) => {
        let timer: ReturnType<typeof setTimeout>;
        return function (this: any, ...args: any[]) {
            if (isProcessingRequest) return;
            setIsProcessingRequest(true);
            clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
                // 操作完成后重置处理状态
                setTimeout(() => {
                    setIsProcessingRequest(false);
                }, delay);
            }, 10);
        };
    };

    // 包装的取消预约函数，添加防抖保护
    const debouncedCancelBooking = debounceRequest(async (courseId: string, courseName: string) => {
        // 如果用户未登录，提示登录
        if (!isAuthenticated) {
            toast.error('请先登录才能取消预约', {
                position: 'top-center',
                duration: 3000
            });
            return;
        }

        // 如果正在加载，不执行操作
        if (loadingCourseId === courseId) return;

        // 设置当前正在操作的课程ID
        setLoadingCourseId(courseId);

        try {
            // 调用取消预约API
            console.log(`发送取消预约请求: 课程ID=${courseId}`);
            const cancelResponse = await bookingApi.cancelBooking(courseId);

            // 检查API响应是否成功
            if (cancelResponse) {
                // 取消预约成功
                toast.success(`已取消课程预约: ${courseName}`, {
                    position: 'top-center',
                    duration: 3000
                });

                // 更新此课程的预约状态 - 取消预约后状态应为canceled而非not_booked
                setBookingStatus(prev => ({
                    ...prev,
                    [courseId]: 'canceled'
                }));

                // 重新加载课程表数据以更新预约人数
                await loadWeekSchedule();
            } else {
                // 取消预约失败，但API返回了响应
                const errorMessage = cancelResponse?.message || '取消预约失败，请稍后重试';
                toast.error(errorMessage, {
                    position: 'top-center',
                    duration: 3000
                });
            }
        } catch (error: any) {
            // 捕获网络错误或其他异常
            console.error('取消预约错误:', error);
            const errorMessage = error.message || '取消预约时发生错误，请重试';
            toast.error(`取消失败: ${errorMessage}`, {
                position: 'top-center',
                duration: 3000
            });
        } finally {
            // 完成加载状态
            setLoadingCourseId('');
        }
    });

    // 处理取消预约 - 使用防抖函数
    const handleCancelBooking = (courseId: string, courseName: string) => {
        debouncedCancelBooking(courseId, courseName);
    };

    // 获取指定日期的课程
    const getCoursesByDate = (date: Date): Course[] => {
        const dateStr = formatDateYYYYMMDD(date);
        const coursesForDate = weekSchedule[dateStr] || [];

        // 过滤有效的课程（ID存在且不是"undefined"）
        return coursesForDate.filter(course => course && course.id && course.id !== 'undefined');
    };

    // 获取用户对某课程的预约状态
    const getUserBookingStatus = (courseId: string): string => {
        // 默认状态为未预约
        const status = bookingStatus[courseId] || 'not_booked';
        return status;
    };

    // 计算课程在时间轴上的位置和高度 - 修改为使用像素高度并添加顶部留白
    const calculateCoursePosition = (course: Course) => {
        try {
            const { start, end } = parseTimeSlot(course.timeSlot);
            // 计算顶部位置（相对于最小时间）(添加顶部30px的留白)
            const top = ((start - minTime) / 30) * 60 + 30; // 每30分钟60px高度，上方留白30px
            // 计算高度（基于时间跨度）
            const height = ((end - start) / 30) * 60; // 每30分钟60px高度

            // 确保1小时课程有足够高度
            const minHeight = 110; // 最小高度像素
            const adjustedHeight = Math.max(height, minHeight);

            return {
                top: `${top}px`,
                height: `${adjustedHeight}px`,
                minHeight: '110px'
            };
        } catch (e) {
            // 默认值，用于无法解析的时间段
            return { top: '30px', height: '110px', minHeight: '110px' };
        }
    };

    // 渲染时间刻度 - 修改为使用固定像素间隔
    const renderTimeLabels = () => {
        return (
            <div className="relative h-full flex flex-col">
                {/* 添加顶部留白 */}
                <div className="h-[30px]"></div>

                {timeRange.map((time, index) => {
                    // 判断是整点还是半点
                    const isHour = time.endsWith(':00');
                    const labelClass = isHour ? 'text-xs font-medium' : 'text-[10px] text-gray-400';

                    // 计算每个时间标签的顶部位置 (添加顶部30px的留白)
                    const topPosition = index * 60 + 30; // 每个时间标签间隔60px，上方留白30px

                    return (
                        <div
                            key={time}
                            className={`text-gray-500 absolute right-2`}
                            style={{
                                top: `${topPosition}px`,
                                transform: 'translateY(-50%)'
                            }}
                        >
                            <span className={labelClass}>{time}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // 渲染课程卡片
    const renderCourseCard = (course: Course) => {
        const { top, height, minHeight } = calculateCoursePosition(course);
        const status = getUserBookingStatus(course.id);
        const isLoading = loadingCourseId === course.id;
        const isBookable = canUserBookCourse(); // 所有课程都可预定（只要用户有权限）
        const isFull = (course.bookedCount || 0) >= course.maxCapacity;
        const isBooked = status === 'confirmed';
        const isCanceled = status === 'canceled';

        // 计算状态相关的样式
        let statusClass = '';
        let actionButton = null;

        switch (status) {
            case 'confirmed':
                statusClass = 'border-yellow-500 bg-yellow-500 hover:bg-yellow-600 shadow-md text-white';
                if (isBookable) {
                    actionButton = (
                        <button
                            onClick={() => handleCancelBooking(course.id, course.name)}
                            disabled={isLoading}
                            className="flex items-center text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap border border-red-200 shadow-sm"
                        >
                            {isLoading ? '取消中...' : (
                                <>
                                    <FiX className="mr-1 flex-shrink-0" />
                                    <span>取消预约</span>
                                </>
                            )}
                        </button>
                    );
                }
                break;
            case 'canceled':
                statusClass = 'border-blue-200 bg-blue-50 hover:bg-blue-100';
                if (isBookable && !isFull) {
                    actionButton = (
                        <button
                            onClick={() => handleBooking(course.id, course.name)}
                            disabled={isLoading || isFull}
                            className="flex items-center text-xs font-medium bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap border border-yellow-200 shadow-sm"
                        >
                            {isLoading ? '预约中...' : (
                                <>
                                    <FiCheck className="mr-1 flex-shrink-0" />
                                    <span>重新预约</span>
                                </>
                            )}
                        </button>
                    );
                }
                break;
            default: // 'not_booked'
                statusClass = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
                if (isBookable && !isFull) {
                    actionButton = (
                        <button
                            onClick={() => handleBooking(course.id, course.name)}
                            disabled={isLoading || isFull}
                            className="flex items-center text-xs font-medium bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap border border-yellow-200 shadow-sm"
                        >
                            {isLoading ? '预约中...' : (
                                <>
                                    <FiCheck className="mr-1 flex-shrink-0" />
                                    <span>预约</span>
                                </>
                            )}
                        </button>
                    );
                }
                break;
        }

        // 确保卡片有最小高度，不管计算出来的高度多小
        return (
            <div
                key={course.id}
                className={`absolute left-1 right-1 rounded-md shadow-sm border ${statusClass} p-2 overflow-hidden transition-all hover:shadow-md`}
                style={{ top, height, minHeight }}
            >
                <div className="h-full flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-semibold ${isBooked ? 'text-white' : 'text-gray-900'} truncate pr-1`}>
                                {course.name}
                            </h4>
                            {course.danceType && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${isBooked
                                    ? 'bg-white text-yellow-700'
                                    : course.danceType === 'public'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {course.danceType === 'public' ? '公共课程' : course.danceType}
                                </span>
                            )}
                        </div>

                        <div className={`text-xs ${isBooked ? 'text-yellow-100' : 'text-gray-600'} grid grid-cols-1 gap-0.5`}>
                            <div className="truncate flex items-center">
                                <FiUser className={`mr-1 ${isBooked ? 'text-white' : 'text-yellow-500'} flex-shrink-0`} />
                                {course.instructor}
                            </div>
                            <div className="truncate flex items-center">
                                <FiMapPin className={`mr-1 ${isBooked ? 'text-white' : 'text-yellow-500'} flex-shrink-0`} />
                                {course.location}
                            </div>
                            <div className="truncate flex items-center">
                                <FiClock className={`mr-1 ${isBooked ? 'text-white' : 'text-yellow-500'} flex-shrink-0`} />
                                {course.timeSlot}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-1 flex items-center justify-between">
                        <div className="min-w-0">
                            {actionButton}
                        </div>

                        <div className="flex items-center flex-shrink-0">
                            {isBooked && !actionButton && (
                                <span className="inline-flex items-center text-xs font-medium text-white bg-yellow-600 px-2 py-0.5 rounded-full border border-yellow-300">
                                    <FiCheck className="mr-1 flex-shrink-0 text-white" />
                                    <span>已预约</span>
                                </span>
                            )}
                            {isCanceled && !actionButton && (
                                <span className="inline-flex items-center text-xs font-medium text-blue-600 mr-2 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                    <FiX className="mr-1 flex-shrink-0 text-blue-500" />
                                    <span>已取消</span>
                                </span>
                            )}

                            <span className={`inline-flex items-center text-xs font-medium ${isBooked
                                ? 'text-white bg-yellow-600 border border-yellow-300'
                                : isFull
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-gray-500 bg-gray-50'
                                } px-1.5 py-0.5 rounded-full`}>
                                {isFull && !isBooked ? <FiAlertCircle className="mr-1 flex-shrink-0" /> : null}
                                <span>{course.bookedCount || 0}/{course.maxCapacity}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 处理上一周和下一周的导航
    const goToPrevWeek = () => {
        const prevWeek = new Date(selectedDate);
        prevWeek.setDate(prevWeek.getDate() - 7);
        setSelectedDate(prevWeek);
        // 重置用于显示loading状态
        setIsLoading(true);
    };

    const goToNextWeek = () => {
        const nextWeek = new Date(selectedDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        setSelectedDate(nextWeek);
        // 重置用于显示loading状态
        setIsLoading(true);
    };

    const goToCurrentWeek = () => {
        setSelectedDate(new Date());
        // 重置用于显示loading状态
        setIsLoading(true);
    };

    // 加载状态
    if (isLoading && !isProcessingRequest) {
        return (
            <div className="min-h-[700px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">加载课程表...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-0 py-6 overflow-visible">
            <DisplayApiError error={apiError} />

            <div className="mb-6 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">课程表</h1>

                {/* 日期导航 */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPrevWeek}
                        className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                        title="上一周"
                    >
                        <FiChevronLeft />
                    </button>

                    <button
                        onClick={goToCurrentWeek}
                        disabled={isCurrentWeek}
                        className={`px-3 py-1 ${isCurrentWeek
                            ? 'bg-yellow-50 text-yellow-600 cursor-default'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'
                            } rounded-md transition text-sm font-medium`}
                    >
                        {isCurrentWeek ? '本周课程' : '回到本周'}
                    </button>

                    <button
                        onClick={goToNextWeek}
                        className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                        title="下一周"
                    >
                        <FiChevronRight />
                    </button>

                    <button
                        onClick={handleRefresh}
                        disabled={isProcessingRequest}
                        className={`flex items-center px-4 py-2 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 transition-colors ${isProcessingRequest ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        <FiRefreshCw className={`mr-2 ${isProcessingRequest ? 'animate-spin' : ''}`} />
                        {isProcessingRequest ? '同步中...' : '同步最新数据'}
                    </button>
                </div>
            </div>

            {!isAuthenticated && (
                <div className="mb-6 mx-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700">
                        登录后可以预约课程。
                        <Link href="/auth/login" className="text-yellow-600 ml-2 hover:underline font-medium">
                            立即登录
                        </Link>
                    </p>
                </div>
            )}

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @media (max-width: 640px) {
                    .container {
                        padding-left: 0;
                        padding-right: 0;
                    }
                }
                .time-grid-hour {
                    border-top: 1px solid rgba(209, 213, 219, 1);
                }
                .time-grid-half-hour {
                    border-top: 1px dashed rgba(229, 231, 235, 1);
                }
                .schedule-column {
                    position: relative;
                    min-height: ${timeRange.length * 60 + 60}px; /* 添加额外的高度，顶部30px和底部30px */
                    height: ${timeRange.length * 60 + 60}px;
                }
                .schedule-table {
                    display: grid;
                    grid-template-columns: 70px repeat(7, 1fr);
                    width: 100%;
                }
                .no-padding-right {
                    padding-right: 0 !important;
                }
            `}</style>

            <div className={scheduleTableStyles.tableContainer}>
                {/* 课程表容器 */}
                <div className={scheduleTableStyles.scrollContainer + " no-padding-right"}>
                    <div className="schedule-table">
                        {/* 时间轴标签 */}
                        <div className="bg-white border-r border-gray-100">
                            <div className="h-20 sticky top-0 z-10 bg-white"></div>
                            <div className="relative schedule-column">
                                {renderTimeLabels()}
                            </div>
                        </div>

                        {/* 周几列 */}
                        {weekDates.map((date, index) => (
                            <div key={formatDateYYYYMMDD(date)} className="border-r border-gray-100 last:border-r-0">
                                <div className={scheduleTableStyles.headerSticky}>
                                    <h3 className="text-sm font-medium text-yellow-800">{weekdays[index]}</h3>
                                    <p className="text-xs text-yellow-600 mt-1">{formatDate(formatDateYYYYMMDD(date))}</p>
                                </div>
                                <div className="relative schedule-column">
                                    {/* 顶部留白 */}
                                    <div className="h-[30px]"></div>

                                    {/* 背景网格线 */}
                                    {timeRange.map((time, index) => {
                                        const isHour = time.endsWith(':00');
                                        const lineClass = isHour ? 'time-grid-hour' : 'time-grid-half-hour';

                                        // 使用固定像素位置 (添加顶部30px的留白)
                                        const topPosition = index * 60 + 30; // 每行高度60px，上方留白30px

                                        return (
                                            <div
                                                key={`grid-${time}`}
                                                className={`absolute left-0 right-0 ${lineClass}`}
                                                style={{
                                                    top: `${topPosition}px`,
                                                    width: '100%'
                                                }}
                                            />
                                        );
                                    })}

                                    {/* 底部留白 */}
                                    <div className="h-[30px]" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}></div>

                                    {/* 课程卡片 */}
                                    {getCoursesByDate(date).map(course => renderCourseCard(course))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 px-4 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p>最后更新时间: {new Date().toLocaleString()}</p>

                <div className="flex items-center flex-wrap justify-center gap-4 my-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600 mr-1"></div>
                        <span>已预约</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-300 mr-1"></div>
                        <span>已取消</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white border border-gray-200 mr-1"></div>
                        <span>未预约</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleTable; 