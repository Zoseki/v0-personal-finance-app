import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { formatAmount } from "@/lib/utils"

type RecentTransactionsProps = {
  userId: string
}

export async function RecentTransactions({ userId }: RecentTransactionsProps) {
  const supabase = await createClient()

  // Get recent transactions where user is payer
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      id,
      description,
      total_amount,
      created_at,
      transaction_splits(
        id,
        amount,
        is_settled,
        profiles!transaction_splits_debtor_id_fkey(display_name)
      )
    `,
    )
    .eq("payer_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giao dịch gần đây</CardTitle>
        <CardDescription>Các khoản chi tiêu bạn đã trả</CardDescription>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const splits = transaction.transaction_splits as unknown as Array<{
                id: string
                amount: number
                is_settled: boolean
                profiles: { display_name: string }
              }>

              const settledCount = splits.filter((s) => s.is_settled).length
              const totalCount = splits.length

              return (
                <div key={transaction.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {splits.map((split) => (
                        <Badge key={split.id} variant={split.is_settled ? "default" : "secondary"} className="text-xs">
                          {split.profiles.display_name}: {formatAmount(Number(split.amount))}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatAmount(Number(transaction.total_amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {settledCount}/{totalCount} đã trả
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
