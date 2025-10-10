import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { formatAmount } from "@/lib/utils"

export default async function MyExpensesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all transactions where user is payer
  const { data: myTransactions } = await supabase
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
        profiles!transaction_splits_debtor_id_fkey(id, display_name)
      )
    `,
    )
    .eq("payer_id", user.id)
    .order("created_at", { ascending: false })

  // Get all transactions where user is debtor
  const { data: myDebts } = await supabase
    .from("transaction_splits")
    .select(
      `
      id,
      amount,
      is_settled,
      item_description,
      created_at,
      transactions!inner(
        id,
        description,
        total_amount,
        created_at,
        profiles!transactions_payer_id_fkey(id, display_name)
      )
    `,
    )
    .eq("debtor_id", user.id)
    .order("created_at", { ascending: false })

  const totalPaid = myTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0
  const totalOwed = myDebts?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
  const totalSettled = myDebts?.filter((d) => d.is_settled).reduce((sum, d) => sum + Number(d.amount), 0) || 0

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Chi tiêu của tôi</h1>
          <p className="text-muted-foreground">Quản lý tất cả các khoản chi tiêu của bạn</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng đã chi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(totalPaid)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng nợ người khác</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{formatAmount(totalOwed)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatAmount(totalSettled)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Các khoản tôi đã trả</CardTitle>
            <CardDescription>Danh sách các giao dịch bạn đã thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            {!myTransactions || myTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
            ) : (
              <div className="space-y-4">
                {myTransactions.map((transaction) => {
                  const splits = transaction.transaction_splits as unknown as Array<{
                    id: string
                    amount: number
                    is_settled: boolean
                    item_description: string
                    profiles: { id: string; display_name: string }
                  }>

                  const settledCount = splits.filter((s) => s.is_settled).length
                  const totalCount = splits.length

                  return (
                    <div key={transaction.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        {transaction.description && transaction.description !== "Chi tiêu" && (
                          <p className="font-medium">{transaction.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {splits.map((split) => (
                            <Badge
                              key={split.id}
                              variant={split.is_settled ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {split.profiles.display_name}: {split.item_description} -{" "}
                              {formatAmount(Number(split.amount))}
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

        <Card>
          <CardHeader>
            <CardTitle>Các khoản tôi nợ</CardTitle>
            <CardDescription>Danh sách các khoản bạn cần thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            {!myDebts || myDebts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn không nợ ai</p>
            ) : (
              <div className="space-y-4">
                {myDebts.map((split) => {
                  const transaction = split.transactions as unknown as {
                    id: string
                    description: string
                    total_amount: number
                    created_at: string
                    profiles: { id: string; display_name: string }
                  }

                  return (
                    <div key={split.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium">{split.item_description}</p>
                        {transaction.description && transaction.description !== "Chi tiêu" && (
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Trả cho: {transaction.profiles.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(Number(split.amount))}</p>
                        {split.is_settled ? (
                          <Badge variant="default" className="text-xs">
                            Đã trả
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Chưa trả
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
