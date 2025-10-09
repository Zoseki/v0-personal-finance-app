import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Đăng ký thành công!</CardTitle>
            <CardDescription>Kiểm tra email để xác nhận</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn đã đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Về trang đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
