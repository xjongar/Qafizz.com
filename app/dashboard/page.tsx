"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  StickyNote,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  Zap,
  Clock,
  Star,
  MessageSquare,
  FolderOpen,
  Camera,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const apps = [
    {
      id: "notes",
      name: "Notes",
      description: "Create and organize your thoughts",
      icon: StickyNote,
      color: "bg-yellow-100 text-yellow-600",
      href: "/dashboard/notes",
      isNew: false,
      lastUsed: "2 hours ago",
    },
    {
      id: "calendar",
      name: "Calendar",
      description: "Manage your schedule and events",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
      href: "/dashboard/calendar",
      isNew: false,
      lastUsed: "1 day ago",
    },
    {
      id: "team",
      name: "Team Chat",
      description: "Collaborate with your team",
      icon: MessageSquare,
      color: "bg-green-100 text-green-600",
      href: "/dashboard/team",
      isNew: true,
      lastUsed: "Never",
    },
    {
      id: "documents",
      name: "Documents",
      description: "Store and share files",
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
      href: "/dashboard/documents",
      isNew: false,
      lastUsed: "3 days ago",
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Track your productivity",
      icon: BarChart3,
      color: "bg-orange-100 text-orange-600",
      href: "/dashboard/analytics",
      isNew: false,
      lastUsed: "1 week ago",
    },
    {
      id: "projects",
      name: "Projects",
      description: "Manage your projects",
      icon: FolderOpen,
      color: "bg-indigo-100 text-indigo-600",
      href: "/dashboard/projects",
      isNew: false,
      lastUsed: "5 hours ago",
    },
    {
      id: "camera",
      name: "Scanner",
      description: "Scan documents and images",
      icon: Camera,
      color: "bg-pink-100 text-pink-600",
      href: "/dashboard/scanner",
      isNew: true,
      lastUsed: "Never",
    },
    {
      id: "settings",
      name: "Settings",
      description: "Customize your workspace",
      icon: Settings,
      color: "bg-gray-100 text-gray-600",
      href: "/dashboard/settings",
      isNew: false,
      lastUsed: "2 weeks ago",
    },
  ]

  const recentActivity = [
    {
      app: "Notes",
      action: "Created new note",
      title: "Meeting Notes - Q4 Planning",
      time: "2 hours ago",
      icon: StickyNote,
    },
    {
      app: "Projects",
      action: "Updated project",
      title: "Website Redesign",
      time: "5 hours ago",
      icon: FolderOpen,
    },
    {
      app: "Calendar",
      action: "Added event",
      title: "Team Standup",
      time: "1 day ago",
      icon: Calendar,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Qafizz</span>
            </div>
            <span className="text-gray-400">|</span>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search apps..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="hidden md:block">
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Qafizz, {user?.firstName}! 👋</h2>
              <p className="text-gray-600">
                Your productivity platform is ready. Here are your apps and recent activity.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Note</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                <span>Schedule Meeting</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                <FileText className="h-4 w-4" />
                <span>Upload Document</span>
              </Button>
            </div>

            {/* Apps Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Your Apps</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {apps.map((app) => {
                  const IconComponent = app.icon
                  return (
                    <Link key={app.id} href={app.href}>
                      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${app.color}`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            {app.isNew && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {app.name}
                            </CardTitle>
                            <CardDescription className="text-sm">{app.description}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Last used: {app.lastUsed}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const IconComponent = activity.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.title}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notes Created</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Projects Active</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Team Members</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Productivity Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Prompt */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Upgrade to Pro</CardTitle>
                <CardDescription className="text-blue-700">
                  Unlock advanced features and boost your productivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Upgrade Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
