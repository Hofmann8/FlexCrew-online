"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingApi, courseApi } from '@/services/api';
import { Course } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// 在课程表中显示的时间槽
const displayTimeSlots = [
    "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00",
    "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00",
    "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"
];

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

// 预订状态接口
interface BookingStatusMap {
    [courseId: string]: string; // 'not_booked', 'confirmed', 'canceled'
}

// 将API中的时间槽映射为显示格式
const mapTimeSlotToDisplay = (timeSlot: string): string => {
    // 直接返回原始时间槽，如果需要格式化可以在这里添加逻辑
    return timeSlot;
};

// 将时间槽转换为易读格式
const timeSlotToReadable = (timeSlot: string): string => {
    return timeSlot;
};

const ScheduleTable = () => {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingCourseId, setLoadingCourseId] = useState<string>('');
    const [bookingStatus, setBookingStatus] = useState<BookingStatusMap>({});
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadCourses();
    }, []);

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

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            setRefreshing(true);

            const coursesResponse = await courseApi.getAllCourses();

            // 输出后端返回的原始数据，用于调试
            console.log('后端API返回的全部课程数据:', coursesResponse);

            // 处理嵌套的数据结构
            let coursesData;
            if (coursesResponse.data && Array.isArray(coursesResponse.data)) {
                coursesData = coursesResponse.data;
            } else if (Array.isArray(coursesResponse)) {
                coursesData = coursesResponse;
            } else {
                throw new Error('获取课程数据失败：返回数据格式不正确');
            }

            // 输出后端返回的课程预约人数信息
            console.log('后端返回的课程预约人数信息:',
                coursesData.map(course => ({
                    id: course.id,
                    name: course.name,
                    bookedCount: course.bookedCount,
                    bookedBy: course.bookedBy,
                    maxCapacity: course.maxCapacity
                }))
            );

            // 处理并标准化课程数据，确保格式一致
            // 注意：这里会将一个跨多个时间段的课程拆分成多个记录
            let normalizedCourses: Course[] = [];

            coursesData.forEach((course: any) => {
                if (!course) {
                    return; // 跳过无效数据
                }

                try {
                    const baseNormalizedCourse = {
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
                        originalTimeSlot: course.timeSlot || course.time || '未知时间',
                        // 确保maxCapacity有值
                        maxCapacity: course.maxCapacity || 20,
                        // 确保bookedCount有值，优先使用API返回的值，即使是0也要使用，否则再考虑使用bookedBy数组长度
                        bookedCount: course.bookedCount !== undefined ? course.bookedCount :
                            (Array.isArray(course.bookedBy) ? course.bookedBy.length : 0)
                    };

                    // 获取这个课程覆盖的所有显示时间段
                    const matchedTimeSlots = displayTimeSlots.filter(slot => {
                        const courseTimeSlot = baseNormalizedCourse.originalTimeSlot;
                        return courseTimeSlot && typeof courseTimeSlot === 'string' &&
                            courseTimeSlot.includes(slot.split('-')[0]);
                    });

                    if (matchedTimeSlots.length > 0) {
                        // 为每个匹配的时间段创建一个课程记录
                        matchedTimeSlots.forEach(timeSlot => {
                            normalizedCourses.push({
                                ...baseNormalizedCourse,
                                timeSlot: timeSlot
                            });
                        });
                    } else {
                        // 如果没有匹配的时间段，至少保留一个记录，使用原始时间
                        normalizedCourses.push({
                            ...baseNormalizedCourse,
                            timeSlot: baseNormalizedCourse.originalTimeSlot
                        });
                    }
                } catch (courseError) {
                    // 处理课程数据错误，但不中断处理流程
                }
            });

            // 使用过渡动画更新状态
            setTimeout(() => {
                setCourses(normalizedCourses);
                setRefreshing(false);
            }, 300);
        } catch (err: any) {
            const errorMessage = err.message || '加载课程失败，请刷新页面重试';
            setError(errorMessage);
            setRefreshing(false);
        } finally {
            setLoading(false);
        }
    };

    const loadAllBookingStatuses = async () => {
        if (!isAuthenticated || courses.length === 0) {
            return;
        }

        try {
            // 获取所有课程的ID
            const courseIds = courses.map(course => course.id);

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
            setError('加载预约状态失败，请刷新页面重试');
        }
    };

    // 添加一个手动刷新功能
    const handleRefresh = async () => {
        // 如果已经在刷新中，不重复操作
        if (refreshing) return;

        setRefreshing(true);
        // 添加清晰的提示，表明正在同步数据
        toast.success('正在从服务器同步最新数据...', {
            position: 'top-center',
            duration: 1500
        });

        try {
            // 获取最新的课程数据
            await loadCourses();

            // 如果用户已登录，同时更新所有课程的预约状态
            if (isAuthenticated) {
                await loadAllBookingStatuses();
            }

            // 刷新成功的提示
            toast.success('课程数据已更新', {
                position: 'top-center',
                duration: 2000
            });
        } catch (error) {
            console.error('刷新课程数据失败', error);
            toast.error('刷新失败，请稍后再试', {
                position: 'top-center',
                duration: 3000
            });
        } finally {
            // 完成后，关闭刷新状态
            setRefreshing(false);
        }
    };

    // 刷新单个课程数据
    const refreshSingleCourse = async (courseId: string) => {
        try {
            // 获取最新的课程信息
            const response = await courseApi.getCourseById(courseId);

            // 输出后端返回的单个课程数据
            console.log(`获取课程ID ${courseId} 的详细信息:`, response);

            // 处理API响应，确保我们能正确获取课程数据
            let refreshedCourse;
            if (response && response.data) {
                refreshedCourse = response.data;
            } else if (response && !response.data) {
                // 如果API直接返回课程数据
                refreshedCourse = response;
            }

            // 输出关键的预约信息
            if (refreshedCourse) {
                console.log(`课程 "${refreshedCourse.name}" (ID: ${courseId}) 的预约信息:`, {
                    bookedCount: refreshedCourse.bookedCount,
                    bookedByLength: Array.isArray(refreshedCourse.bookedBy) ? refreshedCourse.bookedBy.length : '未知',
                    bookedBy: refreshedCourse.bookedBy,
                    maxCapacity: refreshedCourse.maxCapacity
                });
            }

            // 只更新单个课程的关键属性，特别是预约人数
            if (refreshedCourse) {
                setCourses(prevCourses => {
                    return prevCourses.map(course => {
                        if (course.id === courseId) {
                            // 保留课程的所有原有属性，只更新预约人数相关的数据
                            return {
                                ...course,
                                // 优先使用API返回的bookedCount或bookedBy数组长度
                                bookedCount: refreshedCourse.bookedCount !== undefined
                                    ? refreshedCourse.bookedCount
                                    : (Array.isArray(refreshedCourse.bookedBy)
                                        ? refreshedCourse.bookedBy.length
                                        : course.bookedCount),
                                // 更新其他无关显示但数据需要保持最新的字段
                                bookedBy: refreshedCourse.bookedBy || course.bookedBy,
                                maxCapacity: refreshedCourse.maxCapacity || course.maxCapacity
                            };
                        }
                        return course;
                    });
                });
            }

            // 同时更新该课程的预约状态
            if (isAuthenticated) {
                const status = await bookingApi.getCourseBookingStatus(courseId);
                if (status) {
                    setBookingStatus(prev => ({
                        ...prev,
                        [courseId]: status.data?.status || status.status || 'not_booked'
                    }));
                }
            }
        } catch (error) {
            // 捕获错误，但不影响现有显示
            console.error(`刷新课程数据失败，课程ID: ${courseId}`, error);
        }
    };

    // 判断用户是否可以预约课程
    const canUserBookCourse = (): boolean => {
        // 未登录用户不能预约，需要先登录
        if (!isAuthenticated || !user) return false;

        // 只有普通社员(member)才能预约课程
        return user.role === 'member';
    };

    // 处理课程预订
    const handleBooking = async (courseId: string, courseName: string) => {
        if (!isAuthenticated) {
            // 保存当前URL以便登录后返回
            localStorage.setItem('redirect_after_login', window.location.pathname);
            toast.success('请先登录以预约课程', {
                position: 'top-center',
                duration: 3000
            });
            router.push('/auth/login');
            return;
        }

        // 检查用户角色权限
        if (!canUserBookCourse()) {
            toast.error('只有普通社员才能预约课程', {
                position: 'top-center',
                duration: 3000
            });
            return;
        }

        try {
            setLoadingCourseId(courseId);

            // 乐观更新UI状态
            // 1. 临时更新预约状态
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: 'confirmed'
            }));

            // 2. 临时更新课程预约人数
            setCourses(prevCourses => {
                // 获取当前课程的预约人数
                const currentCourse = prevCourses.find(course => course.id === courseId);
                // 确保获取的是精确的预约人数，可能是0也可能是其他值
                const oldCount = currentCourse && currentCourse.bookedCount !== undefined ?
                    currentCourse.bookedCount : 0;

                console.log(`预约前课程 "${courseName}" (ID: ${courseId}) 的预约人数: ${oldCount}`);

                // 更新预约人数，确保+1是基于准确的初始值
                const newCourses = prevCourses.map(course =>
                    course.id === courseId
                        ? {
                            ...course,
                            bookedCount: (course.bookedCount !== undefined ? course.bookedCount : 0) + 1
                        }
                        : course
                );

                // 获取更新后的预约人数
                const updatedCourse = newCourses.find(course => course.id === courseId);
                const newCount = updatedCourse && updatedCourse.bookedCount !== undefined ?
                    updatedCourse.bookedCount : 0;

                console.log(`预约后课程 "${courseName}" (ID: ${courseId}) 的预约人数: ${newCount}`);

                return newCourses;
            });

            // 发送实际请求
            const response = await bookingApi.bookCourse(courseId);

            if (response && (response.success || response.data)) {
                toast.success(`成功预约课程: ${courseName}`, {
                    position: 'top-center',
                    duration: 3000
                });

                // 不再尝试刷新数据，纯粹依赖乐观更新
                // 这样可以避免服务器返回的数据与前端更新冲突
            } else {
                // 如果API请求失败，恢复原状态
                const errorMessage = response?.message || '预约失败，请稍后重试';
                toast.error(errorMessage, {
                    position: 'top-center',
                    duration: 3000
                });

                // 恢复预约状态和课程预约人数
                setBookingStatus(prev => ({
                    ...prev,
                    [courseId]: 'not_booked'
                }));

                setCourses(prevCourses =>
                    prevCourses.map(course =>
                        course.id === courseId
                            ? { ...course, bookedCount: Math.max(0, (course.bookedCount || 0) - 1) }
                            : course
                    )
                );
            }
        } catch (error) {
            console.error(`预约课程失败，课程ID: ${courseId}`, error);
            toast.error('预约失败，发生意外错误，请稍后再试', {
                position: 'top-center',
                duration: 3000
            });

            // 恢复预约状态和课程预约人数
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: 'not_booked'
            }));

            setCourses(prevCourses =>
                prevCourses.map(course =>
                    course.id === courseId
                        ? { ...course, bookedCount: Math.max(0, (course.bookedCount || 0) - 1) }
                        : course
                )
            );
        } finally {
            // 延迟关闭加载状态，使动画看起来更流畅
            setTimeout(() => {
                setLoadingCourseId('');
            }, 300);
        }
    };

    // 处理取消预订
    const handleCancelBooking = async (courseId: string, courseName: string) => {
        // 检查用户角色权限
        if (!canUserBookCourse()) {
            toast.error('只有普通社员才能取消预约课程', {
                position: 'top-center',
                duration: 3000
            });
            return;
        }

        try {
            setLoadingCourseId(courseId);

            // 乐观更新UI状态
            // 1. 临时更新预约状态
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: 'not_booked'
            }));

            // 2. 临时更新课程预约人数
            setCourses(prevCourses => {
                // 获取当前课程的预约人数
                const currentCourse = prevCourses.find(course => course.id === courseId);
                // 确保获取的是精确的预约人数，可能是0也可能是其他值
                const oldCount = currentCourse && currentCourse.bookedCount !== undefined ?
                    currentCourse.bookedCount : 0;

                console.log(`取消预约前课程 "${courseName}" (ID: ${courseId}) 的预约人数: ${oldCount}`);

                // 更新预约人数，确保-1是基于准确的初始值，且不会小于0
                const newCourses = prevCourses.map(course =>
                    course.id === courseId && (course.bookedCount !== undefined ? course.bookedCount : 0) > 0
                        ? {
                            ...course,
                            bookedCount: Math.max(0, (course.bookedCount !== undefined ? course.bookedCount : 0) - 1)
                        }
                        : course
                );

                // 获取更新后的预约人数
                const updatedCourse = newCourses.find(course => course.id === courseId);
                const newCount = updatedCourse && updatedCourse.bookedCount !== undefined ?
                    updatedCourse.bookedCount : 0;

                console.log(`取消预约后课程 "${courseName}" (ID: ${courseId}) 的预约人数: ${newCount}`);

                return newCourses;
            });

            // 发送实际请求
            const response = await bookingApi.cancelBooking(courseId);

            if (response && (response.success !== false)) {
                toast.success(`已取消课程预约: ${courseName}`, {
                    position: 'top-center',
                    duration: 3000
                });

                // 不再尝试刷新数据，纯粹依赖乐观更新
                // 这样可以避免服务器返回的数据与前端更新冲突
            } else {
                // 如果API请求失败，恢复原状态
                const errorMessage = response?.message || '取消预约失败，请稍后重试';
                toast.error(errorMessage, {
                    position: 'top-center',
                    duration: 3000
                });

                // 恢复预约状态和课程预约人数
                setBookingStatus(prev => ({
                    ...prev,
                    [courseId]: 'confirmed'
                }));

                setCourses(prevCourses =>
                    prevCourses.map(course =>
                        course.id === courseId
                            ? { ...course, bookedCount: (course.bookedCount || 0) + 1 }
                            : course
                    )
                );
            }
        } catch (error) {
            console.error(`取消预约失败，课程ID: ${courseId}`, error);
            toast.error('取消预约失败，发生意外错误，请稍后再试', {
                position: 'top-center',
                duration: 3000
            });

            // 恢复预约状态和课程预约人数
            setBookingStatus(prev => ({
                ...prev,
                [courseId]: 'confirmed'
            }));

            setCourses(prevCourses =>
                prevCourses.map(course =>
                    course.id === courseId
                        ? { ...course, bookedCount: (course.bookedCount || 0) + 1 }
                        : course
                )
            );
        } finally {
            // 延迟关闭加载状态，使动画看起来更流畅
            setTimeout(() => {
                setLoadingCourseId('');
            }, 300);
        }
    };

    // 根据星期和时间槽获取课程
    const getCourseBySlot = (weekday: string, timeSlot: string) => {
        return courses.find(
            course => course.weekday === weekday && course.timeSlot === timeSlot
        );
    };

    // 判断用户预约状态
    const getUserBookingStatus = (courseId: string): string => {
        // 如果用户未登录，状态为未预约
        if (!isAuthenticated) return 'not_booked';

        // 检查预约状态缓存
        const status = bookingStatus[courseId];

        // 返回实际状态（confirmed, canceled, not_booked）
        return status || 'not_booked';
    };

    // 渲染课程单元格
    const renderCourseCell = (weekday: string, timeSlot: string) => {
        const course = getCourseBySlot(weekday, timeSlot);

        if (!course) {
            return <td className="border border-gray-200 p-2 bg-gray-50"></td>;
        }

        const bookingStatus = getUserBookingStatus(course.id);
        const isBooked = bookingStatus === 'confirmed';
        const isCanceled = bookingStatus === 'canceled';
        const isLoading = loadingCourseId === course.id;

        // 根据预约状态设置按钮文本
        let buttonLabel = '预约';
        if (isBooked) {
            buttonLabel = isLoading ? '取消中...' : '取消预约';
        } else if (isCanceled) {
            buttonLabel = isLoading ? '预约中...' : '重新预约';
        } else {
            buttonLabel = isLoading ? '预约中...' : '预约';
        }

        // 根据预约状态设置单元格背景色和边框
        let cellStyle = '';
        if (isBooked) {
            cellStyle = 'bg-yellow-50 border-l-4 border-yellow-500';
        } else if (isCanceled) {
            cellStyle = 'bg-gray-50 border-l-4 border-gray-400';
        } else {
            cellStyle = 'bg-white';
        }

        // 计算已预约人数（优先使用 bookedCount，如果没有则使用 bookedBy 数组长度）
        // 确保即使是0也要显示为0，不要默认为其他值
        const bookedCount = course.bookedCount !== undefined ? course.bookedCount :
            (course.bookedBy ? course.bookedBy.length : 0);

        // 计算是否已满
        const isFull = bookedCount >= course.maxCapacity;
        // 是否可以预约 - 考虑用户角色权限
        const canBook = canUserBookCourse() && !isBooked && !isFull;

        return (
            <td className={`border border-gray-200 p-2 ${cellStyle} transition-all duration-300`}>
                <div className={`text-center transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
                    <h3 className="font-bold">{course.name}</h3>
                    <div className="text-sm">
                        <p>导师: {course.instructor}</p>
                        <p>地点: {course.location}</p>
                        <p>
                            {course.originalTimeSlot || timeSlot}
                        </p>
                        <div className="mt-1 flex justify-between text-xs">
                            <span className={`${isFull ? 'text-red-500 font-bold' : 'text-gray-500'} transition-colors duration-300`}>
                                已预约: {bookedCount}/{course.maxCapacity}
                            </span>
                            {isBooked && (
                                <span className="text-yellow-500 font-bold animate-fadeIn">
                                    ✓ 已预约
                                </span>
                            )}
                            {isCanceled && (
                                <span className="text-gray-500 animate-fadeIn">
                                    已取消
                                </span>
                            )}
                        </div>
                    </div>

                    {isAuthenticated ? (
                        user?.role === 'member' ? (
                            <button
                                onClick={() => {
                                    if (isBooked) {
                                        handleCancelBooking(course.id, course.name);
                                    } else {
                                        // 不管是cancelled还是not_booked，都是预约操作
                                        handleBooking(course.id, course.name);
                                    }
                                }}
                                disabled={isLoading || (isFull && !isBooked)}
                                className={`mt-2 w-full py-1 px-2 text-white text-sm rounded transition-all duration-300 
                                    ${isBooked
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : isCanceled
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : 'bg-yellow-500 hover:bg-yellow-600'
                                    } ${(isLoading || (isFull && !isBooked)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isFull && !isBooked
                                    ? '名额已满'
                                    : buttonLabel}
                                {isLoading && (
                                    <span className="ml-2 inline-block animate-spin">⊙</span>
                                )}
                            </button>
                        ) : (
                            <div className="mt-2 text-sm text-gray-500 italic">
                                {user?.role === 'leader' ? '舞种领队无需预约' : '管理员无需预约'}
                            </div>
                        )
                    ) : (
                        <button
                            onClick={() => router.push(`/auth/login?redirect=/schedule`)}
                            disabled={isFull}
                            className={`mt-2 w-full py-1 px-2 text-white text-sm rounded transition-all duration-300
                                bg-yellow-500 hover:bg-yellow-600
                                ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isFull ? '名额已满' : '登录后预约'}
                        </button>
                    )}
                </div>
            </td>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-48 bg-white p-6 rounded-lg shadow-md">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                <p className="mt-4 text-gray-600">正在加载课程表...</p>
            </div>
        );
    }

    // 计算用户已预约的课程数量，仅计算confirmed状态的预约
    const userBookedCoursesCount = isAuthenticated ?
        Object.values(bookingStatus).filter(status => status === 'confirmed').length : 0;

    return (
        <div className={`overflow-x-auto bg-white p-6 rounded-lg shadow-md transition-opacity duration-300 ${refreshing ? 'opacity-70' : 'opacity-100'}`}>
            <DisplayApiError error={error} />

            {/* 用户状态和预约摘要 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        {isAuthenticated ? (
                            <div className="flex items-center">
                                <span className="font-semibold text-green-600">✓ 已登录</span>
                                <span className="ml-2 text-gray-600">欢迎，{user?.username}</span>
                                <div className="ml-4 text-sm bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                                    已预约 <span className="font-bold text-yellow-600">{userBookedCoursesCount}</span> 节课程
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className="font-semibold text-orange-500">● 未登录</span>
                                <span className="ml-2">登录后可以预约课程</span>
                                <Link
                                    href="/auth/login?redirect=/schedule"
                                    className="ml-3 text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                                >
                                    立即登录
                                </Link>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? '刷新中...' : '刷新数据'}
                    </button>
                </div>
            </div>

            <div className={`overflow-x-auto transition-all duration-300 ${refreshing ? 'blur-[1px]' : ''}`}>
                <table className="min-w-full bg-white border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-gray-200 p-3 bg-gray-100"></th>
                            {weekdays.map(day => (
                                <th key={day} className="border border-gray-200 p-3 bg-gray-100 font-semibold">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayTimeSlots.map(slot => (
                            <tr key={slot}>
                                <th className="border border-gray-200 p-3 bg-gray-100 font-semibold whitespace-nowrap">
                                    {mapTimeSlotToDisplay(slot)}
                                </th>
                                {weekdays.map(day => (
                                    <React.Fragment key={`${day}-${slot}`}>
                                        {renderCourseCell(day, slot)}
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-l-4 border-yellow-500 pl-3">课程须知：</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>以上为FlexCrew街舞社委员会制定的官方课表，如无特殊情况将严格按照课表时间上课</li>
                    <li>除街舞社官方课程外，各舞种领队可根据实际情况组织额外训练，但不得影响其他正常课程</li>
                    <li>所有常规课程<span className="font-semibold text-yellow-600">完全免费</span>，如发现任何私自收费行为，请向管理部举报</li>
                    <li>举报联系方式：戴新雨（管理部负责人）18022107804</li>
                    <li>课程预订和取消请提前规划，取消预订请至少提前24小时操作</li>
                </ul>
            </div>
        </div>
    );
};

export default ScheduleTable; 