import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Get current avatar URL to delete old one
    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

    // Upload new avatar to Vercel Blob
    const blob = await put(`avatars/${user.id}-${Date.now()}.${file.name.split(".").pop()}`, file, {
      access: "public",
    })

    // Delete old avatar if exists
    if (profile?.avatar_url && profile.avatar_url.includes("blob.vercel-storage.com")) {
      try {
        await del(profile.avatar_url)
      } catch (error) {
        console.error("Failed to delete old avatar:", error)
      }
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: blob.url }).eq("id", user.id)

    if (updateError) {
      // If update fails, delete the uploaded blob
      await del(blob.url)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
