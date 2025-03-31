import ScheduleTable from '@/components/ScheduleTable';

export default function BookingPage() {
    return (
        <main className="pt-16">
            {/* 约课页面顶部横幅 */}
            <div className="bg-black text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">课程表</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        查看我们每周的课程安排，选择适合您的课程时间进行预约。
                    </p>
                </div>
            </div>

            {/* 课程表 */}
            <ScheduleTable />
        </main>
    );
} 