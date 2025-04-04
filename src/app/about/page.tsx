'use client'

import { Video, MessageSquare, Users, Lock, Globe, Sparkles, Github, Linkedin, Twitter, MessageCircle, Mail } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const features = [
  {
    title: "Real-time Video Chat",
    description: "High-quality video and audio communication with multiple participants.",
    icon: Video
  },
  {
    title: "Text Chat",
    description: "Built-in text chat for sharing messages and links during video calls.",
    icon: MessageSquare
  },
  {
    title: "Room Management",
    description: "Create and manage rooms with customizable settings and participant limits.",
    icon: Users
  },
  {
    title: "Private Rooms",
    description: "Create password-protected rooms for private conversations.",
    icon: Lock
  },
  {
    title: "Public Rooms",
    description: "Join public rooms to meet new people and discuss shared interests.",
    icon: Globe
  },
  {
    title: "Modern Features",
    description: "Screen sharing, file sharing, and other modern collaboration tools.",
    icon: Sparkles
  }
]

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      <div className="container mx-auto px-4">
        {/* About heading with Acme font */}
        <div className="flex justify-center mb-16 pt-12">
          <div className="inline-block px-6 py-2 rounded-full bg-[#ffdc58] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-['Acme',sans-serif]">About Vibely Rooms</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-16">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Vibely Rooms is a modern platform for real-time video communication.
              Create or join rooms, chat with participants, and enjoy high-quality video calls
              with a beautiful, user-friendly interface.
            </p>
          </div>
          
          {/* About the Creator */}
          <div className="mb-16">
            <div className="flex justify-center mb-8">
              <div className="inline-block px-6 py-2 rounded-full bg-[#88AAEE] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-['Acme',sans-serif]">About the Creator</h2>
              </div>
            </div>
            
            <div className="bg-[#fef2e8] dark:bg-[#212121] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <Avatar className="h-40 w-40 border-4 border-black">
                  <AvatarImage src="/face.jpeg" alt="Sarthak" />
                  <AvatarFallback className="bg-[#ffdc58] text-2xl font-bold">SJ</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 font-['Acme',sans-serif]">Sarthak Jain</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  BS Data Science 2027 grad passionate about building full-stack web applications and exploring the world of ML and AI. 
                  Currently learning advanced web development techniques and diving deep into machine learning algorithms.
                </p>
                <div className="flex space-x-3">
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
                </div>
              </div>
            </div>
          </div>
          
          {/* Tech Stack */}
          <div className="mb-16">
            <div className="flex justify-center mb-8">
              <div className="inline-block px-6 py-2 rounded-full bg-[#A388EE] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-['Acme',sans-serif]">Tech Stack</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { name: "Next.js", image: "/logos/nextjs-logo.svg", description: "React framework" },
                { name: "Clerk", image: "/logos/clerk-logo.jpeg", description: "Authentication" },
                { name: "Prisma", image: "/logos/prisma-logo.svg", description: "ORM" },
                { name: "Socket.io", image: "/logos/socketio-logo.png", description: "Real-time communication" },
                { name: "Mediasoup", image: "/logos/mediasoup-logo.svg", description: "WebRTC" },
                { name: "Tailwind CSS", image: "/logos/tailwind-logo.svg", description: "Styling" },
                { name: "Bun", image: "/logos/Bun.svg", description: "Runtime" },
                { name: "TypeScript", image: "/logos/typescript-logo.svg", description: "Type safety" }
              ].map((tech) => (
                <Card key={tech.name} className="bg-[#fef2e8] dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="h-12 w-12 mb-3 flex items-center justify-center">
                      <Image src={tech.image} alt={tech.name} width={40} height={40} className="object-contain" />
                    </div>
                    <h3 className="font-bold mb-1 font-['Acme',sans-serif]">{tech.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-8">
            <div className="flex justify-center mb-8">
              <div className="inline-block px-6 py-2 rounded-full bg-[#FFDC58] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="font-['Acme',sans-serif]">Features</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="bg-[#fef2e8] dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6 hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                  >
                    <div className="mb-4">
                      <Icon className="h-8 w-8 text-black dark:text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 font-['Acme',sans-serif]">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 