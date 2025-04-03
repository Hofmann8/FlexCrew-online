'use client';

import React, { useState } from 'react';
import { Course, User, DANCE_TYPES } from '@/types';

interface CourseAssignFormProps {
    course: Course;
    leaders: User[];
    onSubmit: (courseId: string, data: { danceType: string, leaderId: string | null }) => Promise<void>;
    onCancel: () => void;
}

const CourseAssignForm: React.FC<CourseAssignFormProps> = ({
    course,
    leaders,
    onSubmit,
    onCancel
}) => {
    const [danceType, setDanceType] = useState(course.danceType || '');
    const [leaderId, setLeaderId] = useState(course.leaderId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 处理舞种变更
    const handleDanceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDanceType = e.target.value;
        setDanceType(newDanceType);

        // 如果是公共课程，清空领队ID
        if (newDanceType === 'public') {
            setLeaderId('');
        } else {
            // 如果选择了舞种，尝试找到该舞种的第一个领队
            const matchedLeader = leaders.find(leader => leader.dance_type === newDanceType);
            if (matchedLeader) {
                setLeaderId(String(matchedLeader.id));
            } else {
                setLeaderId('');
            }
        }
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 处理提交数据
            const submitData = {
                danceType,
                leaderId: danceType === 'public' ? null : leaderId
            };

            await onSubmit(course.id, submitData);
        } catch (err) {
            setError(err instanceof Error ? err.message : '提交表单时出错');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">课程归属分配</h3>
                <p className="text-sm text-gray-600">
                    课程：{course.name}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    舞种类型
                </label>
                <select
                    value={danceType}
                    onChange={handleDanceTypeChange}
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
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${danceType === 'public' ? 'text-gray-400' : ''}`}>
                    负责领队
                </label>
                <select
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    disabled={danceType === 'public'}
                    required={danceType !== 'public'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${danceType === 'public' ? 'bg-gray-100' : ''
                        }`}
                >
                    <option value="">
                        {danceType === 'public' ? '公共课程无需领队' : '请选择领队'}
                    </option>
                    {leaders
                        .filter(leader => !danceType || leader.dance_type === danceType)
                        .map(leader => (
                            <option key={leader.id} value={leader.id}>
                                {leader.name} ({leader.dance_type})
                            </option>
                        ))}
                </select>

                {danceType === 'public' && (
                    <p className="mt-1 text-sm text-gray-500">
                        公共课程无需指定领队，系统将自动清除领队关联
                    </p>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                    {loading ? '提交中...' : '保存归属'}
                </button>
            </div>
        </form>
    );
};

export default CourseAssignForm; 