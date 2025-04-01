'use client';

import React, { useState, useEffect } from 'react';
import { CourseFormData, WEEKDAYS, TIME_SLOTS, DANCE_TYPES, User } from '@/types';

interface CourseFormProps {
    initialData?: CourseFormData;
    onSubmit: (data: CourseFormData) => Promise<void>;
    onCancel: () => void;
    isAdmin: boolean;
    leaders?: User[];
    userDanceType?: string;
}

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
        weekday: WEEKDAYS[0],
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
    const [useCustomTime, setUseCustomTime] = useState(!TIME_SLOTS.includes(initialData?.timeSlot || ''));

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
        } else if (name === 'timeSlot' && value) {
            // 从预设时间段中选择时，同时更新startTime和endTime
            const [start, end] = value.split('-');
            setFormData({
                ...formData,
                timeSlot: value,
                startTime: start,
                endTime: end
            });
            setUseCustomTime(false);
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // 处理时间变更
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

        setUseCustomTime(true);
    };

    // 处理舞种变更时自动选择对应领队
    useEffect(() => {
        if (isAdmin && formData.danceType && formData.danceType !== 'public') {
            // 如果选择了舞种，找到该舞种的第一个领队
            const matchedLeader = leaders.find(leader => leader.dance_type === formData.danceType);
            if (matchedLeader && !formData.leaderId) {
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
            setError(err instanceof Error ? err.message : '提交表单时出错');
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
                        上课时间
                    </label>
                    <select
                        name="weekday"
                        value={formData.weekday}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {WEEKDAYS.map(day => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        时间设置
                    </label>
                    <div className="space-y-2">
                        <div className={`flex ${useCustomTime ? 'opacity-50' : ''}`}>
                            <select
                                name="timeSlot"
                                value={useCustomTime ? '' : formData.timeSlot}
                                onChange={handleChange}
                                disabled={useCustomTime}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">自定义时间</option>
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={`grid grid-cols-2 gap-2 ${!useCustomTime ? 'opacity-50' : ''}`}>
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

                        <div className="flex items-center">
                            <input
                                id="custom-time"
                                type="checkbox"
                                checked={useCustomTime}
                                onChange={() => setUseCustomTime(!useCustomTime)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="custom-time" className="ml-2 block text-xs text-gray-600">
                                使用自定义时间
                            </label>
                        </div>
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                负责领队
                            </label>
                            <select
                                name="leaderId"
                                value={formData.leaderId}
                                onChange={handleChange}
                                disabled={formData.danceType === 'public'}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.danceType === 'public' ? 'bg-gray-100' : ''
                                    }`}
                            >
                                <option value="">选择领队{formData.danceType === 'public' ? ' (公共课程无需领队)' : ''}</option>
                                {leaders
                                    .filter(leader => !formData.danceType || leader.dance_type === formData.danceType)
                                    .map(leader => (
                                        <option key={leader.id} value={leader.id}>
                                            {leader.name} ({leader.dance_type})
                                        </option>
                                    ))}
                            </select>
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