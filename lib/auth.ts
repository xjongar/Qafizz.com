"use client"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface Note {
  id: number
  title: string
  content: string
  category: string
  color: string
  starred: boolean
  lastModified: string
  tags: string[]
  backgroundImage: string | null
  userId: string
  createdAt: string
}

export class AuthService {
  private static readonly AUTH_KEY = "qafizz_auth"
  private static readonly USER_KEY = "qafizz_user"
  private static readonly NOTES_KEY = "qafizz_notes"

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(this.AUTH_KEY) === "true"
  }

  static login(user: User): void {
    localStorage.setItem(this.AUTH_KEY, "true")
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static logout(): void {
    localStorage.removeItem(this.AUTH_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static getUser(): User | null {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem(this.USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  static updateUser(user: Partial<User>): void {
    const currentUser = this.getUser()
    if (currentUser) {
      const updatedUser = { ...currentUser, ...user }
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser))
    }
  }

  static getNotes(userId: string): Note[] {
    if (typeof window === "undefined") return []
    const notesStr = localStorage.getItem(this.NOTES_KEY)
    const allNotes: Note[] = notesStr ? JSON.parse(notesStr) : []
    return allNotes.filter((note) => note.userId === userId)
  }

  static saveNote(note: Note): void {
    const allNotes = this.getAllNotes()
    const existingIndex = allNotes.findIndex((n) => n.id === note.id)

    if (existingIndex >= 0) {
      allNotes[existingIndex] = note
    } else {
      allNotes.push(note)
    }

    localStorage.setItem(this.NOTES_KEY, JSON.stringify(allNotes))
  }

  static deleteNote(noteId: number, userId: string): void {
    const allNotes = this.getAllNotes()
    const filteredNotes = allNotes.filter((note) => !(note.id === noteId && note.userId === userId))
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes))
  }

  static clearDefaultNotes(userId: string): void {
    const allNotes = this.getAllNotes()
    const filteredNotes = allNotes.filter((note) => note.userId !== userId || !note.title.includes("Welcome to Qafizz"))
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes))
  }

  private static getAllNotes(): Note[] {
    if (typeof window === "undefined") return []
    const notesStr = localStorage.getItem(this.NOTES_KEY)
    return notesStr ? JSON.parse(notesStr) : []
  }

  static initializeDefaultNotes(userId: string): void {
    const existingNotes = this.getNotes(userId)
    if (existingNotes.length === 0) {
      const defaultNotes: Note[] = [
        {
          id: Date.now(),
          title: "Welcome to Qafizz! 🎉",
          content:
            "Welcome to Qafizz, your all-in-one productivity platform!\n\nWe're excited to have you on board. Here's what you can do:\n\n✅ Create and organize notes\n✅ Manage your projects\n✅ Collaborate with your team\n✅ Track your productivity\n\nGet started by exploring our apps and creating your first note. If you need help, don't hesitate to reach out to our support team.\n\nHappy productivity!\n- The Qafizz Team",
          category: "Welcome",
          color: "bg-blue-100 border-blue-200",
          starred: true,
          lastModified: "Just now",
          tags: ["welcome", "getting-started", "qafizz"],
          backgroundImage: null,
          userId: userId,
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          title: "Meeting Notes - Q4 Planning",
          content: "Discussed quarterly goals, budget allocation, and team expansion plans...",
          category: "Work",
          color: "bg-yellow-100 border-yellow-200",
          starred: false,
          lastModified: "2 hours ago",
          tags: ["meeting", "planning", "q4"],
          backgroundImage: null,
          userId: userId,
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 2,
          title: "Project Ideas",
          content: "1. Mobile app redesign\n2. Customer feedback system\n3. AI integration...",
          category: "Ideas",
          color: "bg-purple-100 border-purple-200",
          starred: false,
          lastModified: "1 day ago",
          tags: ["ideas", "projects"],
          backgroundImage: null,
          userId: userId,
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 3,
          title: "Shopping List",
          content: "Groceries:\n- Milk\n- Bread\n- Eggs\n- Fruits\n- Vegetables",
          category: "Personal",
          color: "bg-green-100 border-green-200",
          starred: false,
          lastModified: "3 days ago",
          tags: ["personal", "shopping"],
          backgroundImage: null,
          userId: userId,
          createdAt: new Date().toISOString(),
        },
      ]

      defaultNotes.forEach((note) => this.saveNote(note))
    }
  }
}
