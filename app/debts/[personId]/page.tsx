import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SettleDebtButton } from "@/components/settle-debt-button"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/utils"

type PageProps = {
  params: Promise<{ personId: string }>
}

export default async function DebtDetailPage({ params }: PageProps) {
  const { personId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get person info
  const { data: person } = await supabase.from("profiles").select("*").eq("id", personId).single()

  if (!person) {
    redirect("/dashboard")
  }

  // Get debts where person owes current user
  const { data: owesMe } = await supabase
    .from("transaction_splits")
    .select(
      `
      id,
      amount,
      is_settled,
      item_description,
      image_url,
      created_at,
      transactions!inner(
        id,
        description,
        total_amount,
        created_at,
        payer_id
      )
    `,
    )
    .eq("debtor_id", personId)
    .eq("transactions.payer_id", user.id)
    .order("created_at", { ascending: false })

  // Get debts where current user owes person
  const { data: iOwe } = await supabase
    .from("transaction_splits")
    .select(
      `
      id,
      amount,
      is_settled,
      item_description,
      image_url,
      created_at,
      transactions!inner(
        id,
        description,
        total_amount,
        created_at,
        payer_id
      )
    `,
    )
    .eq("debtor_id", user.id)
    .eq("transactions.payer_id", personId)
    .order("created_at", { ascending: false })

  const owesMeTotal = owesMe?.filter((s) => !s.is_settled).reduce((sum, s) => sum + Number(s.amount), 0) || 0
  const iOweTotal = iOwe?.filter((s) => !s.is_settled).reduce((sum, s) => sum + Number(s.amount), 0) || 0

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarImage src={person.avatar_url || undefined} alt={person.display_name} />
            <AvatarFallback>{person.display_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết công nợ với {person.display_name}</h1>
            <p className="text-muted-foreground">Xem và quản lý các khoản nợ</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">{person.display_name} nợ bạn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatAmount(owesMeTotal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Bạn nợ {person.display_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatAmount(iOweTotal)}</p>
            </CardContent>
          </Card>
        </div>

        {owesMe && owesMe.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{person.display_name} nợ bạn - Chi tiết</CardTitle>
              <CardDescription>Các khoản {person.display_name} cần trả cho bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {owesMe.map((split) => {
                  const transaction = split.transactions as unknown as {
                    id: string
                    description: string
                    total_amount: number
                    created_at: string
                  }

                  return (
                    <div key={split.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{split.item_description}</p>
                        {transaction.description && transaction.description !== "Chi tiêu" && (
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        )}
                        {split.image_url && (
                          <img
                            src={split.image_url || "/placeholder.svg"}
                            alt={split.item_description}
                            className="w-full max-w-xs h-32 object-cover rounded-md mt-2"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold">{formatAmount(Number(split.amount))}</p>
                          {split.is_settled ? (
                            <Badge variant="default" className="text-xs">
                              Đã trả
                            </Badge>
                          ) : (
                            <SettleDebtButton splitId={split.id} amount={Number(split.amount)} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {iOwe && iOwe.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bạn nợ {person.display_name} - Chi tiết</CardTitle>
              <CardDescription>Các khoản bạn cần trả cho {person.display_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {iOwe.map((split) => {
                  const transaction = split.transactions as unknown as {
                    id: string
                    description: string
                    total_amount: number
                    created_at: string
                  }

                  return (
                    <div key={split.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{split.item_description}</p>
                        {transaction.description && transaction.description !== "Chi tiêu" && (
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        )}
                        {split.image_url && (
                          <img
                            src={split.image_url || "/placeholder.svg"}
                            alt={split.item_description}
                            className="w-full max-w-xs h-32 object-cover rounded-md mt-2"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold">{formatAmount(Number(split.amount))}</p>
                          {split.is_settled ? (
                            <Badge variant="default" className="text-xs">
                              Đã trả
                            </Badge>
                          ) : (
                            <SettleDebtButton splitId={split.id} amount={Number(split.amount)} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
