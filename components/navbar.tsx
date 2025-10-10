"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Plus, Home, Wallet, User } from "lucide-react"

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-semibold">
            Quản lý chi tiêu
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/expenses/add">
                <Plus className="mr-2 h-4 w-4" />
                Thêm chi tiêu
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-expenses">
                <Wallet className="mr-2 h-4 w-4" />
                Chi tiêu của tôi
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Cá nhân
              </Link>
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </nav>
  )
}
