"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Star, X, ImageIcon } from "lucide-react"

interface Note {
  id: number
  userId: string
  title: string
  content: string
  category: string
  color: string
  starred: boolean
  lastModified: string
  tags: string[]
  backgroundImage: string | null
  createdAt: Date
}

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<Note, "userId" | "createdAt">) => void
}

export default function AddNoteModal({ isOpen, onClose, onSave }: AddNoteModalProps) {
  const [noteData, setNoteData] = useState({
    title: "",
    content: "",
    category: "Personal",
    color: "bg-yellow-100 border-yellow-200",
    starred: false,
    tags: "",
    backgroundImage: null as string | null,
  })

  const [isLoading, setIsLoading] = useState(false)

  const colorOptions = [
    { value: "bg-yellow-100 border-yellow-200", label: "Yellow", color: "bg-yellow-200" },
    { value: "bg-blue-100 border-blue-200", label: "Blue", color: "bg-blue-200" },
    { value: "bg-green-100 border-green-200", label: "Green", color: "bg-green-200" },
    { value: "bg-purple-100 border-purple-200", label: "Purple", color: "bg-purple-200" },
    { value: "bg-pink-100 border-pink-200", label: "Pink", color: "bg-pink-200" },
    { value: "bg-orange-100 border-orange-200", label: "Orange", color: "bg-orange-200" },
  ]

  const categories = ["Personal", "Work", "Ideas", "Learning"]

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNoteData((prev) => ({ ...prev, backgroundImage: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBackgroundImage = () => {
    setNoteData((prev) => ({ ...prev, backgroundImage: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!noteData.title.trim() || !noteData.content.trim()) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newNote = {
      id: Date.now(),
      title: noteData.title,
      content: noteData.content,
      category: noteData.category,
      color: noteData.color,
      starred: noteData.starred,
      lastModified: "Just now",
      tags: noteData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      backgroundImage: noteData.backgroundImage,
    }

    onSave(newNote)
    setIsLoading(false)
    handleClose()
  }

  const handleClose = () => {
    setNoteData({
      title: "",
      content: "",
      category: "Personal",
      color: "bg-yellow-100 border-yellow-200",
      starred: false,
      tags: "",
      backgroundImage: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Create New Note</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNoteData((prev) => ({ ...prev, starred: !prev.starred }))}
              className={noteData.starred ? "text-yellow-500" : "text-gray-400"}
            >
              <Star className={`h-4 w-4 ${noteData.starred ? "fill-current" : ""}`} />
            </Button>
          </DialogTitle>
          <DialogDescription>Add a new note to your collection</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={noteData.title}
              onChange={(e) => setNoteData((prev) => ({ ...prev, title: e.target.value }))}
              className="text-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your note content here..."
              value={noteData.content}
              onChange={(e) => setNoteData((prev) => ({ ...prev, content: e.target.value }))}
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Category and Color Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={noteData.category}
                onValueChange={(value) => setNoteData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNoteData((prev) => ({ ...prev, color: option.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${option.color} ${
                      noteData.color === option.value ? "border-gray-800 scale-110" : "border-gray-300"
                    }`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-2">
            <Label>Background Image</Label>
            <div className="space-y-3">
              {noteData.backgroundImage ? (
                <div className="relative">
                  <img
                    src={noteData.backgroundImage || "/placeholder.svg"}
                    alt="Background preview"
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removeBackgroundImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload background image</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas (e.g., work, important, project)"
              value={noteData.tags}
              onChange={(e) => setNoteData((prev) => ({ ...prev, tags: e.target.value }))}
            />
            <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card className={`${noteData.color} border-2 relative overflow-hidden`}>
              {noteData.backgroundImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${noteData.backgroundImage})` }}
                />
              )}
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {noteData.category}
                      </Badge>
                      {noteData.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{noteData.title || "Note Title"}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {noteData.content || "Note content will appear here..."}
                </p>
                {noteData.tags && (
                  <div className="flex flex-wrap gap-1">
                    {noteData.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag.length > 0)
                      .slice(0, 3)
                      .map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!noteData.title.trim() || !noteData.content.trim() || isLoading}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
