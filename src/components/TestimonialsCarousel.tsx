'use client'

import React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion } from 'framer-motion'

const testimonials = [
    {
        id: 3,
        text: "Skeptical at first, I quickly became a fan of Vibely Rooms. It's spam-free, well-moderated, and helped me connect with people from around the world through both text and video chat. I've used platforms like Omegle before, but this one is the best for safe, random chat experiences.",
        author: "Emma L.",
        role: "Verified Member",
        initial: "E"
    },
    {
        id: 4,
        text: "The topic-based rooms are what sets Vibely Rooms apart. I can always find people who share my interests, making conversations more meaningful and enjoyable. The video quality is excellent, and the moderation keeps everything respectful.",
        author: "James T.",
        role: "Active User",
        initial: "J"
    },
    {
        id: 5,
        text: "As someone who values privacy, I appreciate how Vibely Rooms handles user safety. The anonymous chat feature is well-implemented, and the community guidelines are strictly enforced. It's refreshing to have meaningful conversations without worrying about security.",
        author: "Lisa M.",
        role: "Beta Tester",
        initial: "L"
    },
    {
        id: 6,
        text: "The semantic search feature in Vibely Rooms is incredibly powerful. I can find exactly the kind of conversations I'm looking for, and the topic tags make discovery seamless. The neobrutalism design is also refreshingly different from other chat platforms - it's fun but still functional.",
        author: "Alex K.",
        role: "Tech Enthusiast",
        initial: "A"
    },
    {
        id: 7,
        text: "I love the private room functionality! Being able to create password-protected spaces for my friend group with custom settings has been amazing. The video quality using Agora is crystal clear, and the text chat integration alongside video is perfectly implemented.",
        author: "Sophia R.",
        role: "Premium Member",
        initial: "S"
    },
    {
        id: 8,
        text: "As a community organizer, I've tried dozens of platforms for virtual meetups. Vibely Rooms stands out with its intuitive admin controls and room management tools. The ability to moderate effectively while maintaining a friendly atmosphere has made it our go-to platform for discussions.",
        author: "Marcus J.",
        role: "Community Leader",
        initial: "M"
    },
]

export default function TestimonialsCarousel() {
    const [emblaRef] = useEmblaCarousel({ 
        loop: true, 
        align: 'start',
        skipSnaps: false,
        dragFree: false
    }, [Autoplay({ delay: 2500 })])

    return (
        <section className="w-full bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] py-16">
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-['Acme',sans-serif] font-bold mb-6 dark:text-white">
                        Don&apos;t take our word for it
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        We&apos;ve asked random strangers, both men and women, to try our Omegle alternative
                        platform for video and text chat. Here&apos;s what they had to say about our safe space for
                        chatting with strangers:
                    </p>
                </div>

                <div className="embla" ref={emblaRef}>
                    <div className="embla__container">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="embla__slide"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="bg-[#fef2e8] dark:bg-[#212121] p-8 rounded-2xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-4"
                                >
                                    <div className="mb-6">
                                        <span className="text-[#ffdc58] text-6xl font-serif">"</span>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 text-lg mb-8 min-h-[120px]">
                                        {testimonial.text}
                                    </p>
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-[#A388EE] flex items-center justify-center text-black font-bold text-xl border-2 border-black">
                                                {testimonial.initial}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {testimonial.author}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {testimonial.role}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            
        </section>
    )
} 