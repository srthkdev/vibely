'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Button
            
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
                border: '2px solid black',
                boxShadow: '4px 4px 0px 0px #000000',
            }}
            className="h-10 w-10 rounded-full"
        >
            {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
            ) : (
                <MoonIcon className="h-5 w-5" />
            )}
        </Button>
    )
}