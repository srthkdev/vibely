'use client'

import React, { useEffect, useState, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'
import { ThemeSwitcher } from './theme-switcher'
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs"
import Image from 'next/image'
import Link from 'next/link'
import { Button } from './ui/button'

const scrolltoHash = function (element_id: string) {
    const element = document.getElementById(element_id)
    element?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showNav, setShowNav] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)
    const { isSignedIn } = useAuth()

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowNav(false)
            } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
                setShowNav(true)
            }
            setLastScrollY(currentScrollY)
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [lastScrollY])

    const navbarVariants = {
        hidden: { y: '-120%' },
        visible: {
            y: 0,
            transition: { duration: 0.5, delay: 0.2 }
        },
    }

    return (
        <>
            <motion.nav
                className="fixed left-0 top-0 z-50 w-full px-4"
                variants={navbarVariants}
                initial="hidden"
                animate="visible"
            >
                <div
                    className={twMerge(
                        `mx-auto mt-4 flex h-[80px] w-full max-w-screen-xl
                        items-center justify-between px-6 transition-transform
                        duration-300 ease-in-out bg-white dark:bg-[#212121] transform
                        border-3 border-black
                        shadow-[8px_8px_0px_0px_#000] `,
                        showNav ? 'translate-y-0' : '-translate-y-[calc(100%+40px)]'
                    )}
                >
                    {/* Logo */}
                    <h1 className="text-3xl font-black tracking-tight
                transform -rotate-2 hover:rotate-0 transition-transform
                duration-300 min-w-[80px] xs:min-w-[100px] lg:text-5xl flex items-center">
    <Link href="/" className="flex items-center gap-2">
        <Image 
            src="/logo.svg" 
            alt="Vibely Logo"
            width={36}
            height={36}
            className="w-9 h-9"
        />
        <span className="relative">
            {/* Simple 3D black text-shadow effect */}
            <span className="text-white" style={{
                textShadow: 
                    "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000"
            }}>
                Vibely
            </span>
        </span>
    </Link>
</h1>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center text-base lg:text-lg space-x-6">
                        <NavLinks />

                        <div className="flex items-center gap-4">
                            {isSignedIn ? (
                                <>
                                    <Button
                                        variant="yellow"
                                        size="sm"
                                        className="font-bold"
                                    >
                                        <Link href="/rooms" legacyBehavior passHref>
                                            <a>Browse Rooms</a>
                                        </Link>
                                    </Button>
                                    <UserButton afterSignOutUrl="/" />
                                </>
                            ) : (
                                <>
                                    <SignInButton mode="modal">
                                        <Button
                                            variant="yellow"
                                            size="sm"
                                            className="font-bold"
                                        >
                                            Sign In
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <Button
                                            variant="yellow"
                                            size="sm"
                                            className="font-bold"
                                        >
                                            Sign Up
                                        </Button>
                                    </SignUpButton>
                                </>
                            )}
                            <ThemeSwitcher />
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-4">
                        {isSignedIn && <UserButton afterSignOutUrl="/" />}
                        <ThemeSwitcher />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 bg-[var(--yellow)] transform hover:-rotate-3 transition-transform border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white"
                        >
                            <div className="w-6 h-0.5 bg-black mb-1"></div>
                            <div className="w-6 h-0.5 bg-black mb-1"></div>
                            <div className="w-6 h-0.5 bg-black"></div>
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            {isOpen && (
                <div
                    className="fixed top-[100px] z-50 w-full px-4"
                    ref={menuRef}
                >
                    <div
                        className="w-full bg-white dark:bg-[#212121] p-4 transform
                        border-3 border-black dark:border-white
                        shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.8)]"
                    >
                        <MobileNavLinks setIsOpen={setIsOpen} />
                        <div className="mt-4 flex flex-col gap-2">
                            {!isSignedIn ? (
                                <>
                                    <SignInButton mode="modal">
                                        <Button
                                            variant="yellow"
                                            size="sm"
                                            className="w-full"
                                        >
                                            Sign In
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <Button
                                            variant="yellow"
                                            size="sm"
                                            className="w-full"
                                        >
                                            Sign Up
                                        </Button>
                                    </SignUpButton>
                                </>
                            ) : (
                                <Button
                                    variant="yellow"
                                    size="sm"
                                    className="w-full"
                                >
                                    <Link href="/rooms" legacyBehavior passHref>
                                        <a>Browse Rooms</a>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function NavLinks() {
    const links = [
        { href: "/", label: "Home" },
        { href: "/rooms", label: "Rooms" },
        { href: "/about", label: "About" }
    ];

    return (
        <>
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    legacyBehavior
                    passHref
                >
                    <a
                        className="px-3 py-1 font-bold text-black dark:text-white 
                        hover:-translate-y-1 hover:border-black dark:hover:border-white
                        transform transition-all duration-200"
                        style={{
                            border: '2px solid transparent',
                            borderRadius: '0.5rem',
                        }}
                    >
                        {link.label}
                    </a>
                </Link>
            ))}
        </>
    );
}

function MobileNavLinks({ setIsOpen }: { setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    const links = [
        { href: "/", label: "Home" },
        { href: "/rooms", label: "Rooms" },
        { href: "/about", label: "About" }
    ];

    return (
        <div className="flex flex-col space-y-3">
            {links.map((link) => (
                <Button
                    key={link.href}
                    variant="yellow"
                    size="sm"
                    className="w-full"
                >
                    <Link href={link.href} legacyBehavior passHref>
                        <a onClick={() => setIsOpen(false)}>
                            {link.label}
                        </a>
                    </Link>
                </Button>
            ))}
        </div>
    );
}

export default NavBar 