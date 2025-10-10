"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { User, Upload } from "lucide-react"

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profile) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setAvatarUrl(profile.avatar_url || "")
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await response.json()
      setAvatarUrl(data.url)
      setSuccess("Tải avatar lên thành công!")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Không tìm thấy người dùng")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)

      if (updateError) throw updateError
      setSuccess("Cập nhật thông tin thành công!")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp")
      setIsLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError
      setSuccess("Đổi mật khẩu thành công!")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Cài đặt cá nhân</h1>
            <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật avatar và tên hiển thị</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatar-upload">Avatar</Label>
                    <input
                      ref={fileInputRef}
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2 bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Đang tải lên..." : "Tải ảnh lên"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">Tối đa 5MB, định dạng JPG, PNG, GIF</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="display-name">Tên hiển thị</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input id="username" type="text" value={username} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">Tên đăng nhập không thể thay đổi</p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Mật khẩu mới</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
