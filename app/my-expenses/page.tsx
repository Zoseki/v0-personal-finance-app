import { Suspense } from "react"
import { MyExpensesContent } from "@/components/my-expenses-content"
import { Navbar } from "@/components/navbar"

export default function MyExpensesPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Suspense fallback={<div className="h-16 border-b bg-background" />}>
        <Navbar />
      </Suspense>
      <Suspense fallback={<div className="container mx-auto p-6">Đang tải...</div>}>
        <MyExpensesContent />
      </Suspense>
    </div>
  )
}
