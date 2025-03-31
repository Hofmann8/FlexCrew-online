"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { leaderApi } from '@/services/api';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

interface DanceLeadersProps {
    danceType?: string; // 可选的舞种类型，不传则显示所有舞种领队
}

const DanceLeaders: React.FC<DanceLeadersProps> = ({ danceType }) => {
    const [leaders, setLeaders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                setLoading(true);
                let data;

                if (danceType) {
                    // 获取特定舞种的领队
                    data = await leaderApi.getLeadersByDanceType(danceType);
                } else {
                    // 获取所有舞种领队
                    data = await leaderApi.getAllLeaders();
                }

                if (Array.isArray(data)) {
                    setLeaders(data);
                } else {
                    setError('加载舞种领队信息失败');
                }
            } catch (err) {
                // console.error('获取舞种领队信息出错:', err);
                setError('获取舞种领队信息时发生错误');
                toast.error('获取舞种领队信息失败', {
                    position: 'top-center',
                    duration: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLeaders();
    }, [danceType]);

    // 获取舞种类型的中文名称
    const getDanceTypeName = (type: string): string => {
        const danceTypes: Record<string, string> = {
            'breaking': 'Breaking',
            'popping': 'Popping',
            'locking': 'Locking',
            'hiphop': 'Hip-hop',
            'urban': '都市',
            'jazz': '爵士',
            'waacking': 'Waacking',
            'house': 'House',
            'kpop': 'K-pop'
        };
        return danceTypes[type] || type;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                    重新加载
                </button>
            </div>
        );
    }

    if (leaders.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                {danceType
                    ? `暂无${getDanceTypeName(danceType)}舞种的领队信息`
                    : '暂无舞种领队信息'}
            </div>
        );
    }

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold text-center mb-8">
                {danceType
                    ? `${getDanceTypeName(danceType)}舞种领队`
                    : '舞种领队'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {leaders.map(leader => (
                    <div key={leader.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="p-4">
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 mr-4 relative rounded-full overflow-hidden bg-gray-200">
                                    {leader.avatar ? (
                                        <Image
                                            src={leader.avatar}
                                            alt={leader.name || leader.username}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-yellow-500 text-white text-2xl font-bold">
                                            {(leader.name || leader.username)[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{leader.name || leader.username}</h3>
                                    <p className="text-gray-600 text-sm">
                                        {leader.dance_type && getDanceTypeName(leader.dance_type)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-700">
                                <p>联系方式: {leader.email}</p>
                                {/* 可以添加更多信息，如个人简介等 */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DanceLeaders; 