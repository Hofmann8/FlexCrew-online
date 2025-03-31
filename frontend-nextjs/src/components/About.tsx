"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

const About = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [featuresVisible, setFeaturesVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // 当About组件进入视口时触发动画
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        const featuresObserver = new IntersectionObserver(
            ([entry]) => {
                // 当特色部分进入视口时触发动画
                if (entry.isIntersecting) {
                    setFeaturesVisible(true);
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        const featuresSection = document.getElementById('features-section');
        if (featuresSection) {
            featuresObserver.observe(featuresSection);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
            if (featuresSection) {
                featuresObserver.unobserve(featuresSection);
            }
        };
    }, []);

    return (
        <section id="about" ref={sectionRef} className="py-20 bg-gray-100">
            <div className="container mx-auto px-4">
                <div className={`text-center mb-12 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">关于我们</h2>
                    <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                        <h3 className="text-2xl font-bold mb-4">街舞社简介</h3>
                        <p className="text-gray-700 mb-4">
                            大连理工大学FlexCrew街舞社成立于2005年，是一个充满活力与创造力的学生组织。我们聚集了一群热爱街舞的同学，共同学习、交流和发展各种街舞风格，包括Breaking、Popping、Locking、Hip-hop等。
                        </p>
                        <p className="text-gray-700 mb-4">
                            我们定期组织校内外表演、比赛和交流活动，为社员提供展示自我的平台。同时，我们也邀请专业舞者进行指导，帮助社员提高舞蹈技巧和艺术表现力。
                        </p>
                        <p className="text-gray-700">
                            无论你是舞蹈新手还是有一定基础的舞者，我们都欢迎你的加入。在这里，你可以找到志同道合的伙伴，一起探索街舞的魅力。
                        </p>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                        <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 aspect-video">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fdance1.jpg`}
                                alt="Cypher活动"
                                fill
                                referrerPolicy="origin"
                                className="object-cover hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 aspect-video">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fdance2.jpg`}
                                alt="大连高校街舞联盟"
                                fill
                                referrerPolicy="origin"
                                className="object-cover hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 aspect-video">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fdance3.png`}
                                alt="社团日常训练"
                                fill
                                referrerPolicy="origin"
                                className="object-cover hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 aspect-video">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fdance4.jpg`}
                                alt="街舞支教活动"
                                fill
                                referrerPolicy="origin"
                                className="object-cover hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                <div id="features-section" className="mt-16">
                    <h3 className={`text-2xl font-bold mb-6 text-center transition-all duration-1000 transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        我们的特色
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className={`bg-white p-6 rounded-lg shadow-md text-center transition-all duration-700 transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold mb-2">多样化课程</h4>
                            <p className="text-gray-600">
                                提供Breaking、Popping、Locking、Hip-hop等多种街舞风格的专业课程，满足不同学员的需求。
                            </p>
                        </div>

                        <div className={`bg-white p-6 rounded-lg shadow-md text-center transition-all duration-700 delay-200 transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold mb-2">专业指导</h4>
                            <p className="text-gray-600">
                                邀请校内外专业舞者进行教学和指导，提供高质量的街舞培训。
                            </p>
                        </div>

                        <div className={`bg-white p-6 rounded-lg shadow-md text-center transition-all duration-700 delay-400 transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.414 5a1 1 0 110 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L11 8.586l3.293-3.293a1 1 0 01.707-.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold mb-2">表演机会</h4>
                            <p className="text-gray-600">
                                定期组织校内外表演和比赛，为社员提供展示自我的舞台和交流的机会。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About; 