"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import DanceLeaders from '@/components/DanceLeaders';

// 舞种类型的中文名称映射
const danceTypeNames: Record<string, string> = {
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

export default function DanceTypePage() {
    const { danceType } = useParams();
    const danceTypeStr = typeof danceType === 'string' ? danceType : '';
    const danceTypeName = danceTypeNames[danceTypeStr] || danceTypeStr;

    return (
        <main className="pt-16">
            {/* 特定舞种领队页面顶部横幅 */}
            <div className="bg-black text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">{danceTypeName}舞种领队</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        了解{danceTypeName}舞种的领队，他们负责该舞种的教学和发展。
                    </p>
                </div>
            </div>

            {/* 领队展示内容 */}
            <div className="container mx-auto px-4 py-8">
                <DanceLeaders danceType={danceTypeStr} />
            </div>
        </main>
    );
} 