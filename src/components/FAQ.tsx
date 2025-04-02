'use client'

import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        id: "1",
        question: "Is Vibely Rooms safe to use?",
        answer: "Yes, Vibely Rooms is built with safety as a top priority. We have implemented strict moderation policies, user reporting systems, and automated content filtering. All video chats are encrypted, and you can remain anonymous while using the platform. Our community guidelines are actively enforced to ensure a respectful environment for all users."
    },
    {
        id: "2",
        question: "How do I start a video chat?",
        answer: "Starting a video chat is simple! You can either join an existing public room based on your interests, or create your own room. Click the 'Browse Rooms' button to see available chat rooms, or use 'Create Room' to start your own. You'll need to allow camera and microphone permissions when prompted."
    },
    {
        id: "3",
        question: "Can I create private rooms?",
        answer: "Yes! You can create password-protected private rooms for your friends or community. When creating a room, simply enable the 'Private Room' option and set a password. Only users with the password will be able to join. You can also customize room settings like participant limit and chat features."
    },
    {
        id: "4",
        question: "What makes Vibely Rooms different from other chat platforms?",
        answer: "Vibely Rooms stands out with its focus on interest-based connections, high-quality video streaming using Agora, and modern neobrutalist design. We offer features like topic-based rooms, seamless text and video chat integration, and strong moderation tools. Our platform is designed to foster meaningful conversations while maintaining user privacy and safety."
    },
    {
        id: "5",
        question: "Do I need to create an account?",
        answer: "While you can browse public rooms without an account, creating one is recommended to access all features. An account lets you create rooms, save favorites, customize your profile, and build a trusted network. Registration is quick and only requires minimal information to get started."
    }
]

export default function FAQ() {
    return (
        <section className="w-full bg-[#fef2e8] dark:bg-[#212121] py-16">
            
            
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-['Acme',sans-serif] font-bold mb-6 dark:text-white">
                        Frequently Asked Questions
                    </h2>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq) => (
                        <AccordionItem 
                            key={faq.id} 
                            value={faq.id}
                            className="bg-[#ffdc58] border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline dark:text-black">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 text-gray-600 dark:bg-[#212121] dark:text-white">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
            
            
        </section>
    )
} 