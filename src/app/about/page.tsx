'use client'

import { motion } from 'framer-motion'
import { FaVideo, FaUsers, FaLock, FaComments } from 'react-icons/fa'
import React from 'react'

export default function AboutPage() {
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

  const features = [
    {
      title: "Live Video Chats",
      description: "Connect with high-quality video and audio streams using our Agora-powered platform.",
      icon: <FaVideo className="text-4xl text-[#76fbd9]" />
    },
    {
      title: "Topic-Based Rooms",
      description: "Join rooms based on interests, or create your own topic to gather like-minded people.",
      icon: <FaUsers className="text-4xl text-[#76fbd9]" />
    },
    {
      title: "Private Rooms",
      description: "Create password-protected rooms for private meetings with friends or colleagues.",
      icon: <FaLock className="text-4xl text-[#76fbd9]" />
    },
    {
      title: "Chat Messages",
      description: "Send text messages within rooms for when video isn't enough.",
      icon: <FaComments className="text-4xl text-[#76fbd9]" />
    }
  ]

  return (
    <main className="min-h-screen w-full py-20 px-4 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] pt-32">
      <motion.div 
        className="max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 text-center"
        >
          About Video Chat Room
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-xl mb-16 text-center max-w-3xl mx-auto"
        >
          Our platform is designed to make video communication easy, fun, and accessible for everyone. 
          Whether you're catching up with friends, hosting a community event, or holding a team meeting, 
          our topic-based video chat rooms bring people together.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="neobrutalism-card p-6"
            >
              <div className="flex flex-col items-center md:items-start md:flex-row gap-4">
                <div className="mb-4 md:mb-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-lg">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="neobrutalism-card bg-[#76fbd9] dark:bg-[#4b6fff] p-8"
        >
          <h2 className="text-3xl font-bold mb-4 text-black">Get Started Today</h2>
          <p className="text-xl mb-6 text-black">
            Sign up for a free account and start creating or joining video chat rooms in minutes. 
            Our simple, intuitive interface makes it easy to connect with others.
          </p>
          <div className="flex justify-center">
            <motion.a 
              href="/rooms"
              className="neobrutalism-button bg-white text-black px-8 py-3 text-xl font-bold inline-block"
              
            >
              Browse Rooms
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  )
} 