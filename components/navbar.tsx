"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Plus, Home, Wallet, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single()
        setProfile(data)
      }
    }

    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-semibold md:text-xl">
          Quản lý chi tiêu
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2">
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
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Profile Avatar */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/profile">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{getInitials(profile?.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          </Button>

          {/* Logout Button */}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-2">
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/expenses/add" onClick={() => setIsOpen(false)}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm chi tiêu
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/my-expenses" onClick={() => setIsOpen(false)}>
                <Wallet className="mr-2 h-4 w-4" />
                Chi tiêu của tôi
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/profile" onClick={() => setIsOpen(false)}>
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(profile?.display_name)}</AvatarFallback>
                </Avatar>
                Cá nhân
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
