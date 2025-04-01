import React from 'react';
import ScheduleTable from '@/components/ScheduleTable';

export const metadata = {
    title: '课程表 | 大连理工大学FlexCrew街舞社',
    description: '查看并预约大连理工大学FlexCrew街舞社的课程和活动安排。',
};

export default function SchedulePage() {
    return (
        <main className="min-h-screen">
            {/* 课程表顶部横幅 */}
            <div className="bg-black text-white py-20 pt-32">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">课程安排</h1>
                    <p className="text-xl max-w-2xl mx-auto text-gray-300">
                        查看并预约我们的课程。我们提供多样化的街舞课程，从初学者到进阶水平，满足不同学员的需求。
                    </p>
                </div>
            </div>

            {/* 课程表内容 */}
            <div className="bg-gray-100 py-12">
                <div className="container mx-auto px-4">
                    <div className="mx-auto">
                        <ScheduleTable />
                    </div>
                </div>
            </div>
        </main>
    );
} 