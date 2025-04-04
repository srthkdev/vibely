'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Github, Linkedin, Twitter, MessageCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function Footer() {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied to clipboard!`)
    }

    return (
        <footer className="w-full bg-bg dark:bg-secondaryBlack">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Logo and Name */}
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 relative flex items-center justify-center">
                            <Image 
                                src="/logo.svg" 
                                alt="Vibely Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                            />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="relative">
                                {/* Simple 3D black text-shadow effect */}
                                <span className="text-white" style={{
                                    textShadow: 
                                        "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000"
                                }}>
                                    Vibely
                                </span>
                            </span>
                        </h1>
                    </div>

                    {/* Center Text */}
                    <div className="text-center flex flex-col items-center justify-center">
                        <p className="text-gray-600 dark:text-gray-300">© 2024 All rights reserved.</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Built with ❤️ & ☕ by sarthak
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex justify-end space-x-4">
                            <Link 
                                href="https://github.com/23f3000839" 
                                target="_blank"
                                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:border-black transition-all"
                            >
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link 
                                href="https://www.linkedin.com/in/sarthak-jain-32b114228" 
                                target="_blank"
                                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:border-black hover:bg-[#0077b5] transition-all group"
                            >
                                <Linkedin className="h-5 w-5 group-hover:text-white" />
                            </Link>
                            <Link 
                                href="https://x.com/sarthxk20" 
                                target="_blank"
                                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:border-black transition-all"
                            >
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <button
                                onClick={() => copyToClipboard('sarthxk20', 'Discord username')}
                                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:border-black transition-all"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => copyToClipboard('23f3000839@ds.study.iitm.ac.in', 'Email')}
                                className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:border-black transition-all"
                            >
                                <Mail className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
} 