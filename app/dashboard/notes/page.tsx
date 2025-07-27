"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StickyNote, Plus, Search, Star, Trash2, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import AddNoteModal from "./add-note-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useAuth } from "@/hooks/use-auth"
import { AuthService, type Note } from "@/lib/auth"

export default function NotesApp() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddNote, setShowAddNote] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    noteId: number | null
    noteTitle: string
  }>({
    isOpen: false,
    noteId: null,
    noteTitle: "",
  })
  const [hasCreatedFirstNote, setHasCreatedFirstNote] = useState(false)

  const categories = ["All", "Welcome", "Work", "Personal", "Ideas"]
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Load notes on component mount
  useEffect(() => {
    if (user) {
      const userNotes = AuthService.getNotes(user.id)
      setNotes(userNotes)

      // Check if user has created any non-default notes
      const nonDefaultNotes = userNotes.filter((note) => !note.title.includes("Welcome to Qafizz"))
      setHasCreatedFirstNote(nonDefaultNotes.length > 0)
    }
  }, [user])

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSaveNote = (newNote: Omit<Note, "userId" | "createdAt">) => {
    if (!user) return

    const noteWithUser: Note = {
      ...newNote,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    // If this is the first user-created note, clear default notes
    if (!hasCreatedFirstNote) {
      AuthService.clearDefaultNotes(user.id)
      setHasCreatedFirstNote(true)
    }

    // Save the note
    AuthService.saveNote(noteWithUser)

    // Update local state
    const updatedNotes = AuthService.getNotes(user.id)
    setNotes(updatedNotes)
  }

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      noteId,
      noteTitle,
    })
  }

  const confirmDelete = () => {
    if (deleteDialog.noteId && user) {
      AuthService.deleteNote(deleteDialog.noteId, user.id)
      const updatedNotes = AuthService.getNotes(user.id)
      setNotes(updatedNotes)
    }
    setDeleteDialog({ isOpen: false, noteId: null, noteTitle: "" })
  }

  const toggleStar = (noteId: number) => {
    if (!user) return

    const noteToUpdate = notes.find((note) => note.id === noteId)
    if (noteToUpdate) {
      const updatedNote = { ...noteToUpdate, starred: !noteToUpdate.starred }
      AuthService.saveNote(updatedNote)
      const updatedNotes = AuthService.getNotes(user.id)
      setNotes(updatedNotes)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <StickyNote className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-xl font-bold">Notes</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 w-64"
              />
            </div>
            <Button onClick={() => setShowAddNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`${note.color} hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden`}
            >
              {note.backgroundImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${note.backgroundImage})` }}
                />
              )}
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {note.category}
                      </Badge>
                      {note.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-yellow-700 transition-colors">
                      {note.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id, note.title)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <p className="text-sm text-gray-600 line-clamp-4">{note.content}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{note.lastModified}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(note.id)
                      }}
                    >
                      <Star className={`h-3 w-3 ${note.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notes found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Create your first note to get started"}
            </p>
            <Button onClick={() => setShowAddNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}

        {/* Add Note Modal */}
        <AddNoteModal isOpen={showAddNote} onClose={() => setShowAddNote(false)} onSave={handleSaveNote} />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, noteId: null, noteTitle: "" })}
          onConfirm={confirmDelete}
          noteTitle={deleteDialog.noteTitle}
        />
      </div>
    </div>
  )
}
