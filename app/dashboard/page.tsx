import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { DebtSummary } from "@/components/debt-summary"
import { RecentTransactions } from "@/components/recent-transactions"
import { PendingPaymentRequests } from "@/components/pending-payment-requests"

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

  const { data: pendingRequests } = await supabase
    .from("transaction_splits")
    .select(
      `
      id,
      amount,
      debtor_id,
      transaction_id,
      transactions(
        id,
        payer_id,
        profiles:payer_id(id, display_name, avatar_url)
      ),
      profiles:debtor_id(id, display_name, avatar_url)
    `,
    )
    .eq("settlement_status", "pending")

  const formattedRequests =
    pendingRequests
      ?.map((req: any) => ({
        id: req.id,
        amount: req.amount,
        debtor: req.profiles || { id: req.debtor_id, display_name: "User", avatar_url: null },
        payer: req.transactions?.profiles || { id: "", display_name: "Unknown", avatar_url: null },
        personId: req.debtor_id,
        payerId: req.transactions?.payer_id,
      }))
      .filter((req: any) => req.payerId === user.id)
      .reduce((acc: any[], req: any) => {
        const existingGroup = acc.find((item) => item.debtor.id === req.debtor.id)
        if (existingGroup) {
          existingGroup.amount += req.amount
          existingGroup.ids.push(req.id)
        } else {
          acc.push({
            ...req,
            ids: [req.id],
          })
        }
        return acc
      }, []) || []

  console.log("[v0] Current user ID:", user.id)
  console.log("[v0] Pending requests data:", pendingRequests)
  console.log("[v0] Filtered requests:", formattedRequests)

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Xin chào, {profile?.display_name}!</h1>
          <p className="text-muted-foreground text-sm md:text-base">Quản lý chi tiêu và công nợ của bạn</p>
        </div>

        <PendingPaymentRequests requests={formattedRequests} />

        <DebtSummary userId={user.id} />

        <RecentTransactions userId={user.id} />
      </div>
    </div>
  )
}
