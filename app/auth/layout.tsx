import type React from "react"
import { AuthGuard } from "@/components/auth-guard"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>
}
