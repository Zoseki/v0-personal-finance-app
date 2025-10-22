"use client"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { DebtSummary } from "@/components/debt-summary"
import { RecentTransactions } from "@/components/recent-transactions"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Xin chào, {profile?.display_name}!</h1>
          <p className="text-muted-foreground text-sm md:text-base">Quản lý chi tiêu và công nợ của bạn</p>
        </div>

        <DebtSummary userId={user.id} />

        <RecentTransactions userId={user.id} />
      </div>
    </div>
  )
}
