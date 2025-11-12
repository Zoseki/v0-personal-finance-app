"use client"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface PendingRequest {
  id: string
  amount: number
  debtor: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  payer: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  personId: string
  ids?: string[]
}

export function PendingPaymentRequests({ requests }: { requests: PendingRequest[] }) {
  if (!requests || requests.length === 0) {
    return null
  }

  const totalAmount = requests.reduce((sum, req) => sum + req.amount, 0)

  return (
    <Card className="p-4 md:p-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-orange-900 dark:text-orange-100">
            Yêu cầu thanh toán chờ xác nhận
          </h2>
          <p className="text-sm text-orange-700 dark:text-orange-200">
            {requests.length} người - Tổng: {totalAmount.toFixed(0)}k
          </p>
        </div>

        <div className="space-y-3">
          {requests.map((request) => (
            <Link key={request.personId} href={`/debts/${request.personId}`}>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.debtor.avatar_url || ""} />
                    <AvatarFallback>{request.debtor.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {request.debtor?.display_name || "User"} gửi yêu cầu thanh toán cho{" "}
                      {request.payer?.display_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground"></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600 dark:text-orange-400">{request.amount.toFixed(0)}k</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}
