'use client'

import { TypeAnimation } from 'react-type-animation'
import { FaVideo, FaUsers, FaLock, FaComments } from 'react-icons/fa'
import Marquee from "react-fast-marquee"
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import TestimonialsCarousel from '@/components/TestimonialsCarousel'
import FAQ from '@/components/FAQ'
import '@/styles/embla.css'

export default function HomePage() {
    const [currentWord, setCurrentWord] = useState(0);
    const words = ["Connect", "Share", "Thrive"];
    const colors = ["#FFDC58", "#88AAEE", "#A388EE"];

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    }

    const socialIconVariants = {
        hidden: { scale: 0 },
        visible: {
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        },
        hover: {
            scale: 1.1,
            rotate: [0, -10, 10, -10, 0],
            transition: {
                duration: 0.4
            }
        }
    }

    const buttonAnimationVariants = {
        hidden: { scale: 0 },
        visible: {
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 1.5
            }
        },
        tap: {
            scale: 0.95
        }
    }

    const marqueeContainerVariants = {
        hidden: { y: 100, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 1.2
            }
        }
    }

    return (
        <React.Fragment>
            <header
                className="relative flex min-h-[100vh] w-full flex-col items-center justify-center bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] pt-16 lg:pt-0">
                <motion.div
                    className="mx-auto w-container max-w-full px-5 py-[110px] text-left lg:py-[150px] flex flex-col lg:flex-row"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start lg:ml-8">

                        <motion.h1
                            variants={itemVariants}
                            className="text-3xl font-heading md:text-4xl lg:text-5xl mt-5 font-[var(--font-heading)] flex flex-col"
                        >
                            <div className="flex items-center">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={currentWord}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ color: colors[currentWord] }}
                                    >
                                        {words[currentWord]}
                                    </motion.span>
                                </AnimatePresence>
                                
                            </div>
                            <div className="mt-2">
                                Your Perfect Space in Vibely Rooms
                            </div>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="my-8 text-lg font-bold leading-relaxed md:text-xl lg:text-2xl tracking-tight max-w-[620px]"
                        >
                            Your perfect space to connect and share with others who love what you love. Join topic-based video rooms designed for genuine conversation.
                        </motion.p>

                        <div className="flex flex-col items-center lg:items-start mb-8">
                            <motion.div
                                variants={buttonAnimationVariants}
                                initial="hidden"
                                animate="visible"
                                whileTap="tap"
                                className="flex gap-4"
                            >
                                <Link href="/rooms">
                                    <Button
                                        variant="yellow"
                                        size="lg"
                                    >
                                        Browse Rooms
                                    </Button>
                                </Link>
                                <Link href="/room/create">
                                    <Button 
                                        variant="yellow"
                                        size="lg"
                                    >
                                        Create Room
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                    <motion.div
                    className="w-full lg:w-1/2 mt-8 lg:mt-0 flex justify-center"
                    variants={itemVariants}
                >
                    <div className="relative w-[450px] h-[450px] rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#76fbd9] to-[#4b6fff] opacity-80 rounded-xl"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white dark:bg-secondaryBlack p-4 rounded-lg shadow-lg" 
                                style={{
                                    border: '2px solid black',
                                    boxShadow: '8px 8px 0px 0px #000000',
                                }}>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {[1, 2, 3, 4].map((num) => (
                                        <div 
                                            key={num} 
                                            className="w-[100px] h-[70px] bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"
                                            style={{
                                                border: '1px solid black',
                                            }}
                                        >
                                            <FaUsers className="text-3xl text-gray-500 dark:text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Button size="sm" className="rounded-full p-2 h-8 w-8">
                                                <FaVideo className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" className="rounded-full p-2 h-8 w-8">
                                                <FaComments className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-xs">Leave Room</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                </motion.div>

            </header>

            {/* Black line separator */}
            <div className="w-full h-1 bg-black"></div>

            {/* Features Section */}
            <section className="w-full bg-[#fef2e8] dark:bg-[#212121] py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Section title */}
                    <div className="flex justify-center mb-16">
                        <div className="inline-block px-6 py-2 rounded-full bg-[#ffdc58] text-black font-medium text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            Reach people like you
                        </div>
                    </div>

                    {/* Anonymous Chat Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                        <div className="space-y-2 text-center lg:text-center col-span-1 lg:col-span-2">
                            <h2 className="text-3xl md:text-4xl font-bold font-['Acme',sans-serif] mx-auto dark:text-white">Anonymous Chat, Meet new people</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                Find strangers worldwide, the new modern Omegle and OmeTV alternative. Connect with real people, 
                                enjoy ad free text and video chats, and build genuine friendships.
                            </p>
                        </div>
                    </div>

                    {/* Chat with Similar Interests Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                            <img 
                                src="/features.webp" 
                                alt="Chat with Similar Interests" 
                                className="rounded-lg max-w-full h-auto"
                            />
                        </div>
                        <div className="order-1 lg:order-2 space-y-2">
                            <div className="text-[#6366f1] dark:text-[#a5b4fc] font-medium italic">Strangers turned friends</div>
                            <h2 className="text-4xl md:text-5xl font-bold dark:text-white">Chat with Random Strangers With Similar <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4f46e5] to-[#3b82f6] dark:from-[#818cf8] dark:to-[#60a5fa]">Interests</span></h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Talk to online strangers who love what you love. Chat about hobbies and enjoy fun conversations - 
                                all from one place! Making new friends based on interests is made easy.
                            </p>
                        </div>
                    </div>

                    {/* Video Chat Section */}
                    <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-2">
                            <div className="text-[#d946ef] dark:text-[#e879f9] font-medium italic">Say hello to strangers worldwide</div>
                            <h2 className="text-4xl md:text-5xl font-bold dark:text-white">Simple and <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899] dark:from-[#f0abfc] dark:to-[#f472b6]">Fun</span> Video Chats</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Enjoy video chats with strangers worldwide, our platform is designed to make it easy and safe to
                                connect with people from all over the world. Meet new people, make friends, and have fun!
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <img 
                                src="/features-1.webp" 
                                alt="Video Chat Features" 
                                className="rounded-lg max-w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>
            {/* Black line separator */}
            <div className="w-full h-1 bg-black"></div>
            {/* Testimonials Section */}
            <TestimonialsCarousel />

            {/* Black line separator */}
            <div className="w-full h-[2px] bg-black"></div>
            {/* FAQ Section */}
            <FAQ />
        </React.Fragment>
    )
}
