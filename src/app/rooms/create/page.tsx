'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Image as ImageIcon, Plus, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"

export default function CreateRoomPage() {
  const router = useRouter()
  const { user } = useUser()
  const [isPublic, setIsPublic] = useState(true)
  const [image, setImage] = useState<string | null>(null)
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic('')
    }
  }

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic))
  }

  const getTopicColorClass = (index: number) => {
    const colors = [
      "bg-[#FFDC58] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", // Yellow
      "bg-[#88AAEE] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", // Blue
      "bg-[#A388EE] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"  // Purple
    ]
    return colors[index % colors.length]
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    if (!user) {
      toast.error('You must be logged in to create a room')
      return
    }
    
    try {
      // Create a new room via API
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies and authentication headers
        body: JSON.stringify({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          isPublic,
          maxUsers: parseInt(formData.get("maxUsers") as string),
          topics: topics,
          password: isPublic ? null : formData.get("password") as string,
          userId: user.id, // Pass the user ID from Clerk
          // Note: In a real app, you'd handle image upload separately
          // For now, we're not sending the image to keep it simple
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create room')
      }
      
      toast.success('Room created successfully!')
      
      // Redirect to rooms page
      router.push("/rooms")
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room. Please try again.')
    }
  }

  return (
    <main className="relative min-h-screen pt-24 pb-20 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      <div className="container mx-auto px-4">
        {/* Create Room heading with Acme font */}
        <div className="flex justify-center mb-16 pt-12">
          <div className="inline-block px-6 py-2 rounded-full bg-[#ffdc58] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-['Acme',sans-serif]">Create a New Room</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-[#fef2e8] dark:bg-[#212121] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Media Upload */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold font-['Acme',sans-serif]">Room Thumbnail</Label>
                <div 
                  className={`relative h-48 w-full rounded-lg cursor-pointer overflow-hidden flex items-center justify-center ${
                    !image ? 'bg-gradient-to-r from-[#fef2e8] to-[#Ffdc58] border-2 border-black' : ''
                  }`}
                  onClick={() => document.getElementById('room-image')?.click()}
                >
                  {image ? (
                    <>
                      <Image 
                        src={image}
                        alt="Room thumbnail"
                        fill
                        className="object-cover"
                      />
                      <button 
                        type="button" 
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImage(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-12 w-12 text-black mb-2" />
                      <p className="text-black font-medium">Click to upload a thumbnail (optional)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="room-image" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              {/* Room Name and Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold font-['Acme',sans-serif]">Room Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter room name"
                    className="border-2 border-black h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-semibold font-['Acme',sans-serif]">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Describe your room"
                    className="border-2 border-black min-h-[100px]"
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold font-['Acme',sans-serif]">Topics</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    placeholder="Add a topic (e.g. Technology, Gaming, Art)"
                    className="border-2 border-black h-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTopic()
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    variant="yellow"
                    onClick={addTopic}
                    className="flex items-center gap-1 h-12"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {topics.map((topic, index) => (
                      <div 
                        key={topic} 
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border-2 ${getTopicColorClass(index)}`}
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="text-black hover:text-gray-700 focus:outline-none ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Max Users */}
              <div className="space-y-2">
                <Label htmlFor="maxUsers" className="text-lg font-semibold font-['Acme',sans-serif]">Maximum Users</Label>
                <Input
                  id="maxUsers"
                  name="maxUsers"
                  type="number"
                  min="2"
                  max="50"
                  required
                  defaultValue="10"
                  className="border-2 border-black h-12"
                />
              </div>

              {/* Public/Private Toggle with 3D Buttons */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold font-['Acme',sans-serif]">Room Visibility</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 border-black transition-all duration-150 ${
                      isPublic 
                        ? 'bg-[#88AAEE] shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-x-[3px] translate-y-[3px]' 
                        : 'bg-white dark:bg-[#212121] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Public</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 border-black transition-all duration-150 ${
                      !isPublic 
                        ? 'bg-[#A388EE] shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-x-[3px] translate-y-[3px]' 
                        : 'bg-white dark:bg-[#212121] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                    }`}
                  >
                    <EyeOff className="h-4 w-4" />
                    <span className="font-medium">Private</span>
                  </button>
                </div>
              </div>

              {/* Password (for private rooms) */}
              {!isPublic && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-semibold font-['Acme',sans-serif]">Room Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter room password"
                    className="border-2 border-black h-12"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  variant="yellow" 
                  size="lg"
                  className="flex-1"
                >
                  Create Room
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 border-2 border-black"
                >
                  <Link href="/rooms" legacyBehavior passHref>
                    <a>Cancel</a>
                  </Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
} 