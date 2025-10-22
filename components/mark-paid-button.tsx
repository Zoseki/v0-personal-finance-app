"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check } from "lucide-react"

type MarkPaidButtonProps = {
  splitId: string
  amount: number
}

export function MarkPaidButton({ splitId, amount }: MarkPaidButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleMarkPaid = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("transaction_splits")
        .update({
          settlement_status: "confirmed",
          is_settled: true,
          settled_at: new Date().toISOString(),
        })
        .eq("id", splitId)

      if (error) throw error

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error marking as paid:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs bg-green-600 text-white hover:bg-green-700">
          <Check className="mr-1 h-3 w-3" />
          Đánh dấu đã trả
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh dấu đã trả</DialogTitle>
          <DialogDescription>Xác nhận rằng bạn đã nhận được thanh toán</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-2xl font-bold">{amount}k</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleMarkPaid} disabled={isLoading}>
            {isLoading ? "Đang xác nhận..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
