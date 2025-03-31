import React from 'react';
import DanceLeaders from '@/components/DanceLeaders';

export default function LeadersPage() {
    return (
        <main className="pt-16">
            {/* 舞种领队页面顶部横幅 */}
            <div className="bg-black text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">舞种领队</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        了解我们各舞种的领队，他们负责各自舞种的教学和发展。
                    </p>
                </div>
            </div>

            {/* 领队展示内容 */}
            <div className="container mx-auto px-4 py-8">
                <DanceLeaders />
            </div>
        </main>
    );
} 