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

type SettleDebtButtonProps = {
  splitId: string
  amount: number
}

export function SettleDebtButton({ splitId, amount }: SettleDebtButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSettle = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("transaction_splits")
        .update({
          is_settled: true,
          settled_at: new Date().toISOString(),
        })
        .eq("id", splitId)

      if (error) throw error

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error settling debt:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs bg-transparent">
          <Check className="mr-1 h-3 w-3" />
          Đánh dấu đã trả
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
          <DialogDescription>Bạn có chắc chắn muốn đánh dấu khoản nợ này đã được thanh toán?</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-2xl font-bold">{amount.toFixed(2)} đ</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSettle} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
