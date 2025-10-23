"use client"

import { Button } from "@/components/ui/button"

export function ConfirmAllButton({ splitIds, count }: { splitIds: string[]; count: number }) {
  return (
    <Button
      size="sm"
      variant="default"
      onClick={async () => {
        const response = await fetch("/api/debts/confirm-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ splitIds }),
        })
        if (response.ok) {
          window.location.reload()
        }
      }}
    >
      Xác nhận tất cả ({count})
    </Button>
  )
}

export function MarkAllPaidButton({ splitIds, count }: { splitIds: string[]; count: number }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const response = await fetch("/api/debts/mark-all-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ splitIds }),
        })
        if (response.ok) {
          window.location.reload()
        }
      }}
    >
      Đánh dấu tất cả đã trả ({count})
    </Button>
  )
}

export function SendAllRequestsButton({ splitIds, count }: { splitIds: string[]; count: number }) {
  return (
    <Button
      size="sm"
      variant="default"
      onClick={async () => {
        const response = await fetch("/api/debts/send-all-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ splitIds }),
        })
        if (response.ok) {
          window.location.reload()
        }
      }}
    >
      Gửi tất cả yêu cầu ({count})
    </Button>
  )
}
