import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
        item_description,
        profiles!transaction_splits_debtor_id_fkey(display_name, avatar_url)
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
                item_description: string
                profiles: { display_name: string; avatar_url: string | null }
              }>

              const settledCount = splits.filter((s) => s.is_settled).length
              const totalCount = splits.length

              return (
                <div key={transaction.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="space-y-2 flex-1">
                    {transaction.description && transaction.description !== "Chi tiêu" && (
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {splits.map((split) => (
                        <div
                          key={split.id}
                          className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-background"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={split.profiles.avatar_url || undefined}
                              alt={split.profiles.display_name}
                            />
                            <AvatarFallback className="text-[10px]">
                              {split.profiles.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={split.is_settled ? "line-through opacity-60" : ""}>
                            {split.profiles.display_name}: {split.item_description} -{" "}
                            {formatAmount(Number(split.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
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
