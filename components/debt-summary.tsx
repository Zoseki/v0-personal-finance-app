import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { formatAmount } from "@/lib/utils"

type DebtSummaryProps = {
  userId: string
}

type DebtInfo = {
  person_id: string
  person_name: string
  total_amount: number
  type: "owes_me" | "i_owe"
}

export async function DebtSummary({ userId }: DebtSummaryProps) {
  const supabase = await createClient()

  // Get debts where others owe current user (user is payer)
  const { data: owesMe } = await supabase
    .from("transaction_splits")
    .select(
      `
      debtor_id,
      amount,
      is_settled,
      profiles!transaction_splits_debtor_id_fkey(id, display_name),
      transactions!inner(payer_id)
    `,
    )
    .eq("transactions.payer_id", userId)
    .eq("is_settled", false)

  // Get debts where current user owes others (user is debtor)
  const { data: iOwe } = await supabase
    .from("transaction_splits")
    .select(
      `
      debtor_id,
      amount,
      is_settled,
      transactions!inner(payer_id, profiles!transactions_payer_id_fkey(id, display_name))
    `,
    )
    .eq("debtor_id", userId)
    .eq("is_settled", false)

  // Aggregate debts
  const debtMap = new Map<string, DebtInfo>()

  // Process owes me
  if (owesMe) {
    for (const item of owesMe) {
      const profile = item.profiles as unknown as { id: string; display_name: string }
      if (profile.id === userId) continue // Skip self

      const key = `${profile.id}_owes_me`
      const existing = debtMap.get(key)
      if (existing) {
        existing.total_amount += Number(item.amount)
      } else {
        debtMap.set(key, {
          person_id: profile.id,
          person_name: profile.display_name,
          total_amount: Number(item.amount),
          type: "owes_me",
        })
      }
    }
  }

  // Process i owe
  if (iOwe) {
    for (const item of iOwe) {
      const transaction = item.transactions as unknown as {
        payer_id: string
        profiles: { id: string; display_name: string }
      }
      const profile = transaction.profiles

      const key = `${profile.id}_i_owe`
      const existing = debtMap.get(key)
      if (existing) {
        existing.total_amount += Number(item.amount)
      } else {
        debtMap.set(key, {
          person_id: profile.id,
          person_name: profile.display_name,
          total_amount: Number(item.amount),
          type: "i_owe",
        })
      }
    }
  }

  const debts = Array.from(debtMap.values())

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Người khác nợ bạn</CardTitle>
          <CardDescription>Những người cần trả tiền cho bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {debts.filter((d) => d.type === "owes_me").length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có ai nợ bạn</p>
          ) : (
            <div className="space-y-3">
              {debts
                .filter((d) => d.type === "owes_me")
                .map((debt) => (
                  <Link key={debt.person_id} href={`/debts/${debt.person_id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{debt.person_name}</p>
                        <p className="text-sm text-muted-foreground">Nợ bạn</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {formatAmount(debt.total_amount)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Bạn nợ người khác</CardTitle>
          <CardDescription>Những khoản bạn cần trả</CardDescription>
        </CardHeader>
        <CardContent>
          {debts.filter((d) => d.type === "i_owe").length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn không nợ ai</p>
          ) : (
            <div className="space-y-3">
              {debts
                .filter((d) => d.type === "i_owe")
                .map((debt) => (
                  <Link key={debt.person_id} href={`/debts/${debt.person_id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{debt.person_name}</p>
                        <p className="text-sm text-muted-foreground">Bạn nợ</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {formatAmount(debt.total_amount)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
