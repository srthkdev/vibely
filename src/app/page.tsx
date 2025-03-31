'use client'

import { TypeAnimation } from 'react-type-animation'
import { FaVideo, FaUsers, FaLock, FaComments } from 'react-icons/fa'
import Marquee from "react-fast-marquee"
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import React from "react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
    const features = [
        { text: "Video Chat", Icon: FaVideo },
        { text: "Topic Rooms", Icon: FaUsers },
        { text: "Private Rooms", Icon: FaLock },
        { text: "Live Chat", Icon: FaComments },
    ]

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

    const buttonVariants = {
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
        <header
            className="relative flex min-h-[100vh] w-full flex-col items-center justify-center bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] pt-16 lg:pt-0">
            <motion.div
                className="mx-auto w-container max-w-full px-5 py-[110px] text-left lg:py-[150px] flex flex-col lg:flex-row"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start lg:ml-8">
                    <motion.div variants={itemVariants}>
                        <TypeAnimation
                            className="text-3xl lg:text-3xl font-bold text-[#76fbd9] dark:text-[#76fbd9] relative z-10"
                            sequence={['Connect!', 1000, 'Collaborate!', 1000, 'Communicate!', 1000, 'Create!', 1000]}
                        />
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-3xl font-heading md:text-4xl lg:text-5xl mt-5"
                    >
                        Video Chat Rooms 📹
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="my-12 mt-8 text-lg font-normal leading-relaxed md:text-xl lg:text-2xl lg:leading-relaxed"
                    >
                        Join topic-based video rooms and connect with people who share your interests.
                        Create private rooms for team meetings or public ones to meet new people.
                        Experience high-quality video and audio with our modern platform.
                    </motion.p>

                    <div className="flex flex-col items-center lg:items-start mb-8">
                        <motion.div
                            variants={buttonVariants}
                            initial="hidden"
                            animate="visible"
                            whileTap="tap"
                            className="flex gap-4"
                        >
                            <Link href="/rooms">
                                <Button 
                                    size="lg" 
                                    className="h-12 text-base font-heading md:text-lg lg:h-14 lg:text-xl"
                                    style={{
                                        border: '2px solid black',
                                        boxShadow: '4px 4px 0px 0px #000000',
                                    }}
                                >
                                    Browse Rooms
                                </Button>
                            </Link>
                            <Link href="/room/create">
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    className="h-12 text-base font-heading md:text-lg lg:h-14 lg:text-xl"
                                    style={{
                                        border: '2px solid black',
                                        boxShadow: '4px 4px 0px 0px #000000',
                                    }}
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
                                            <Button size="sm" variant="outline" className="rounded-full p-2 h-8 w-8">
                                                <FaVideo className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="rounded-full p-2 h-8 w-8">
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

            <motion.div
                className="absolute bottom-0 left-0 w-full"
                variants={marqueeContainerVariants}
                initial="hidden"
                animate="visible"
            >
                <Marquee
                    className="border-t-border dark:border-t-darkBorder dark:bg-secondaryBlack border-t-2 border-b-2 border-b-border dark:border-b-darkBorder bg-white py-3 sm:py-5 font-base"
                    direction="left"
                    speed={90}
                    loop={0}
                >
                    {features.map((feature, id) => (
                        <motion.div
                            className="flex items-center mx-8"
                            key={id}
                            whileHover={{scale: 1.1, transition: {duration: 0.2}}}
                        >
                            <feature.Icon className="text-5xl mr-4 text-[#76fbd9] dark:text-[#76fbd9]"/>
                            <span className="text-xl font-heading sm:text-2xl lg:text-4xl">
                                {feature.text}
                            </span>
                        </motion.div>
                    ))}
                </Marquee>
            </motion.div>
        </header>
    )
}
