import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateRoomPage() {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      isPublic,
      maxUsers: parseInt(formData.get("maxUsers") as string),
      topics: (formData.get("topics") as string).split(",").map((t) => t.trim()),
      password: formData.get("password"),
    }

    // TODO: Implement room creation API call
    console.log(data)
    router.push("/rooms")
  }

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Create a New Room</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Enter room name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            placeholder="Describe your room"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">Topics (comma-separated)</Label>
          <Input
            id="topics"
            name="topics"
            required
            placeholder="e.g., Technology, Gaming, Art"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxUsers">Maximum Users</Label>
          <Input
            id="maxUsers"
            name="maxUsers"
            type="number"
            min="2"
            max="50"
            required
            defaultValue="10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="isPublic">Public Room</Label>
        </div>

        {!isPublic && (
          <div className="space-y-2">
            <Label htmlFor="password">Room Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter room password"
            />
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit">Create Room</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/rooms")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  )
} 