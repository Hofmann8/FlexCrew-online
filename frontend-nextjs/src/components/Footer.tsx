"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { SiBilibili } from 'react-icons/si';
import { RiWechatFill } from 'react-icons/ri';
import { FaTiktok, FaQq } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [showQQModal, setShowQQModal] = useState(false);
    const [showWeChatModal, setShowWeChatModal] = useState(false);

    // 模态窗口组件
    const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
                    <div className="bg-yellow-500 px-4 py-3 flex justify-between items-center">
                        <h3 className="font-bold text-black">{title}</h3>
                        <button onClick={onClose} className="text-black hover:text-gray-800">
                            <IoMdClose size={24} />
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                    <div className="bg-gray-100 px-4 py-3 text-right">
                        <button
                            onClick={onClose}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative z-10">
            <div className="absolute inset-0 bg-black"></div>
            <footer className="relative py-12 text-white">
                <div className="container mx-auto px-4">
                    {/* 社交媒体图标 */}
                    <div className="flex justify-center space-x-8 mb-8">
                        {/* Bilibili */}
                        <a
                            href="https://space.bilibili.com/36266742"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#00A1D6] transition-colors transform hover:scale-110 duration-300"
                            title="Bilibili"
                        >
                            <SiBilibili size={28} />
                        </a>

                        {/* 微信公众号 */}
                        <button
                            onClick={() => setShowWeChatModal(true)}
                            className="text-gray-400 hover:text-[#07C160] transition-colors transform hover:scale-110 duration-300 bg-transparent border-0 cursor-pointer"
                            title="微信公众号"
                        >
                            <RiWechatFill size={28} />
                        </button>

                        {/* 抖音 */}
                        <a
                            href="https://www.douyin.com/user/MS4wLjABAAAAqHPjkWTGbT8Nxz7-jErJ0ts3nc1vNO57i0hShg64YM8p6EyoYCopobhhOoi_nquz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#FE2C55] transition-colors transform hover:scale-110 duration-300"
                            title="抖音"
                        >
                            <FaTiktok size={26} />
                        </a>

                        {/* QQ群 */}
                        <button
                            onClick={() => setShowQQModal(true)}
                            className="text-gray-400 hover:text-[#12B7F5] transition-colors transform hover:scale-110 duration-300 bg-transparent border-0 cursor-pointer"
                            title="QQ群"
                        >
                            <FaQq size={28} />
                        </button>
                    </div>

                    <div className="pt-8 border-t border-gray-800 text-center">
                        <p className="text-gray-400 mb-2">
                            © {currentYear} 大连理工大学FlexCrew街舞社. 保留所有权利.
                        </p>
                        <p className="text-gray-500 text-sm flex justify-center items-center">
                            <a
                                href="https://beian.miit.gov.cn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gray-400 transition-colors flex items-center"
                            >
                                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9.09003 9.00001C9.32513 8.33167 9.78918 7.76811 10.4 7.40914C11.0108 7.05016 11.7289 6.91894 12.4272 7.03872C13.1255 7.15849 13.7588 7.52153 14.2151 8.06353C14.6714 8.60554 14.9211 9.29153 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                辽ICP备2025051480号-1
                            </a>
                        </p>
                    </div>
                </div>

                {/* 微信公众号模态窗口 */}
                <Modal
                    isOpen={showWeChatModal}
                    onClose={() => setShowWeChatModal(false)}
                    title="FlexCrew街舞社 微信公众号"
                >
                    <div className="text-center">
                        <div className="mb-4 bg-gray-100 p-8 rounded-lg flex justify-center">
                            <div className="w-48 h-48 relative">
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fwechat.jpg`}
                                    alt="微信公众号二维码"
                                    fill
                                    referrerPolicy="origin"
                                    className="object-contain rounded-md"
                                />
                            </div>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">FlexCrew街舞社</h4>
                        <p className="text-gray-600 mb-4">扫描上方二维码，关注我们的微信公众号，获取最新活动和课程信息！</p>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-gray-700">
                            <p className="flex items-center">
                                <RiWechatFill className="text-[#07C160] mr-2" size={20} />
                                <span>微信搜索 <strong>FlexCrew</strong> 也可找到我们</span>
                            </p>
                        </div>
                    </div>
                </Modal>

                {/* QQ群模态窗口 */}
                <Modal
                    isOpen={showQQModal}
                    onClose={() => setShowQQModal(false)}
                    title="FlexCrew街舞社 QQ群"
                >
                    <div className="text-center">
                        <div className="mb-4 bg-gray-100 p-8 rounded-lg flex justify-center">
                            <div className="w-48 h-48 relative">
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2FQQ.png`}
                                    alt="QQ群二维码"
                                    fill
                                    referrerPolicy="origin"
                                    className="object-contain rounded-md"
                                />
                            </div>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">FlexCrew街舞社官方QQ群</h4>
                        <p className="text-gray-600 mb-4">扫描上方二维码，加入我们的QQ群，与舞友交流和获取社团资讯！</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
                            <p className="flex items-center">
                                <FaQq className="text-[#12B7F5] mr-2" size={20} />
                                <span>QQ群号: <strong>992044083</strong></span>
                            </p>
                        </div>
                    </div>
                </Modal>
            </footer>
        </div>
    );
};

export default Footer;