'use client';

import React, { useState, useEffect } from 'react';
import { CourseFormData, WEEKDAYS, DANCE_TYPES, User } from '@/types';

interface CourseFormProps {
    initialData?: CourseFormData;
    onSubmit: (data: CourseFormData) => Promise<void>;
    onCancel: () => void;
    isAdmin: boolean;
    leaders?: User[];
    userDanceType?: string;
}

// 格式化日期为YYYY-MM-DD
const formatDateYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 获取今天的YYYY-MM-DD格式
const getTodayFormatted = (): string => {
    return formatDateYYYYMMDD(new Date());
};

const CourseForm: React.FC<CourseFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isAdmin,
    leaders = [],
    userDanceType = ''
}) => {
    // 如果初始数据中有timeSlot，将其拆分为startTime和endTime
    const parseTimeSlot = (timeSlot?: string) => {
        if (!timeSlot) return { startTime: '09:00', endTime: '10:00' };
        const [start, end] = timeSlot.split('-');
        return { startTime: start || '09:00', endTime: end || '10:00' };
    };

    const { startTime: initialStartTime, endTime: initialEndTime } = parseTimeSlot(initialData?.timeSlot);

    const [formData, setFormData] = useState<CourseFormData & { startTime: string, endTime: string }>({
        name: '',
        instructor: '',
        location: '',
        courseDate: initialData?.courseDate || getTodayFormatted(),
        timeSlot: initialData?.timeSlot || '09:00-10:00',
        startTime: initialStartTime,
        endTime: initialEndTime,
        maxCapacity: 20,
        description: '',
        danceType: userDanceType || (isAdmin ? '' : userDanceType),
        leaderId: '',
        ...initialData
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeError, setTimeError] = useState<string | null>(null);

    // 表单更改处理函数
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // 处理数字输入
        if (name === 'maxCapacity') {
            const numValue = parseInt(value);
            setFormData({
                ...formData,
                [name]: isNaN(numValue) ? 0 : numValue,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // 验证时间合理性
    const validateTimeSlot = (): boolean => {
        // 清除之前的时间错误
        setTimeError(null);

        // 检查时间格式是否符合HH:MM-HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(formData.timeSlot)) {
            setTimeError("时间格式无效，请使用HH:MM-HH:MM格式");
            return false;
        }

        // 解析时间
        const [startStr, endStr] = formData.timeSlot.split('-');
        const [startHour, startMinute] = startStr.split(':').map(Number);
        const [endHour, endMinute] = endStr.split(':').map(Number);

        // 计算分钟数
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        // 检查结束时间是否晚于开始时间
        if (endMinutes <= startMinutes) {
            setTimeError("时间段不合理：结束时间必须晚于开始时间");
            return false;
        }

        // 计算课程时长
        const duration = endMinutes - startMinutes;

        // 检查课程时长是否在合理范围内（30分钟到4小时）
        if (duration < 30) {
            setTimeError(`课程时长过短（${duration}分钟）：课程不应少于30分钟`);
            return false;
        }

        if (duration > 240) {
            setTimeError(`课程时长过长（${duration}分钟）：课程不应超过4小时`);
            return false;
        }

        return true;
    };

    // 处理时间变更时的验证
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // 自动更新timeSlot字段
            if (name === 'startTime' || name === 'endTime') {
                const newTimeSlot = `${newData.startTime}-${newData.endTime}`;
                newData.timeSlot = newTimeSlot;
            }

            return newData;
        });

        // 在时间变更后，我们不立即验证，而是在提交时验证
        // 清除之前的错误提示
        setTimeError(null);
    };

    // 处理舞种变更时自动选择对应领队
    useEffect(() => {
        if (isAdmin && formData.danceType && formData.danceType !== 'public') {
            // 如果选择了舞种，找到该舞种的第一个领队
            const matchedLeader = leaders.find(leader => leader.dance_type === formData.danceType);
            if (matchedLeader) {
                setFormData(prev => ({
                    ...prev,
                    leaderId: matchedLeader.id
                }));
            }
        } else if (formData.danceType === 'public') {
            // 如果是公共课程，清空领队ID
            setFormData(prev => ({
                ...prev,
                leaderId: ''
            }));
        }
    }, [formData.danceType, isAdmin, leaders]);

    // 表单提交处理函数
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 在提交前验证时间
        if (!validateTimeSlot()) {
            return; // 如果时间验证失败，直接返回不提交
        }

        setLoading(true);
        setError(null);

        try {
            // 确保timeSlot格式正确
            const submitData = {
                ...formData,
                timeSlot: `${formData.startTime}-${formData.endTime}`
            };

            // 移除额外的字段
            delete (submitData as any).startTime;
            delete (submitData as any).endTime;

            await onSubmit(submitData);
        } catch (err) {
            // 处理API错误
            if (err instanceof Error) {
                // 检查错误消息中是否包含特定关键词
                const errorMsg = err.message;
                if (errorMsg.includes('时间格式无效') ||
                    errorMsg.includes('时间段不合理') ||
                    errorMsg.includes('课程时长过') ||
                    errorMsg.includes('该地点和时间段已被')) {
                    setTimeError(errorMsg);
                } else {
                    setError(errorMsg);
                }
            } else {
                setError('提交表单时出错');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        课程名称
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        授课教师
                    </label>
                    <input
                        type="text"
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        上课地点
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        最大容量
                    </label>
                    <input
                        type="number"
                        name="maxCapacity"
                        min="1"
                        max="100"
                        value={formData.maxCapacity}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        上课日期
                    </label>
                    <input
                        type="date"
                        name="courseDate"
                        value={formData.courseDate}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        时间设置
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                开始时间
                            </label>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleTimeChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                结束时间
                            </label>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleTimeChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    {timeError && (
                        <div className="mt-2 text-sm text-red-600">
                            {timeError}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                        注意：课程时长必须在30分钟到4小时之间，且必须在同一天内完成
                    </div>
                </div>

                {isAdmin && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                舞种类型
                            </label>
                            <select
                                name="danceType"
                                value={formData.danceType}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">请选择舞种</option>
                                {DANCE_TYPES.map(type => (
                                    <option key={type} value={type}>
                                        {type === 'public' ? '公共课程' : type}
                                    </option>
                                ))}
                            </select>
                            {formData.danceType && formData.danceType !== 'public' && (
                                <div className="mt-2 text-xs text-gray-500">
                                    将自动关联到该舞种的领队账号
                                </div>
                            )}
                            {formData.danceType === 'public' && (
                                <div className="mt-2 text-xs text-gray-500">
                                    公共课程无需关联领队
                                </div>
                            )}
                        </div>

                        <div className="hidden">
                            <input
                                type="hidden"
                                name="leaderId"
                                value={formData.leaderId}
                            />
                        </div>
                    </>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    课程描述
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                >
                    {loading ? '提交中...' : initialData ? '更新课程' : '创建课程'}
                </button>
            </div>
        </form>
    );
};

export default CourseForm; 