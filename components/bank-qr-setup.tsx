"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import QRCode from "qrcode.react"
import { Download } from "lucide-react"

const VIETNAMESE_BANKS = [
  { code: "970405", name: "Ngân hàng Công thương Việt Nam (Vietcombank)" },
  { code: "970407", name: "Ngân hàng Ngoại thương Việt Nam (Vietbank)" },
  { code: "970415", name: "Ngân hàng Phát triển Việt Nam (BIDV)" },
  { code: "970418", name: "Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)" },
  { code: "970422", name: "Ngân hàng Kỹ thương Việt Nam (Techcombank)" },
  { code: "970423", name: "Ngân hàng Quân đội (MB)" },
  { code: "970428", name: "Ngân hàng Tiên Phong (TPBank)" },
  { code: "970430", name: "Ngân hàng Sài Gòn Thương Tín (Sacombank)" },
  { code: "970432", name: "Ngân hàng Á Châu (ACB)" },
  { code: "970433", name: "Ngân hàng Hàng Hải Việt Nam (MSB)" },
  { code: "970434", name: "Ngân hàng Sài Gòn (SGB)" },
  { code: "970435", name: "Ngân hàng Công nghiệp Việt Nam (VIB)" },
  { code: "970436", name: "Ngân hàng Bản Việt (BVB)" },
  { code: "970437", name: "Ngân hàng Kiên Long (KLB)" },
  { code: "970438", name: "Ngân hàng Phương Đông (OCB)" },
  { code: "970440", name: "Ngân hàng Quốc tế Việt Nam (VIB)" },
  { code: "970441", name: "Ngân hàng Xuất Nhập Khẩu Việt Nam (Eximbank)" },
  { code: "970442", name: "Ngân hàng Đông Á (DAB)" },
  { code: "970443", name: "Ngân hàng Phát triển Nhân lực (HDB)" },
  { code: "970444", name: "Ngân hàng Thương mại Cổ phần Sài Gòn (SGB)" },
  { code: "970445", name: "Ngân hàng Thương mại Cổ phần Kỹ Thương (Techcombank)" },
  { code: "970446", name: "Ngân hàng Thương mại Cổ phần Quân Đội (MB)" },
  { code: "970448", name: "Ngân hàng Thương mại Cổ phần Tiên Phong (TPBank)" },
  { code: "970449", name: "Ngân hàng Thương mại Cổ phần Sài Gòn Thương Tín (Sacombank)" },
]

export function BankQRSetup() {
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [qrValue, setQrValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadBankInfo()
  }, [])

  const loadBankInfo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("bank_name, bank_account_number, bank_account_holder")
      .eq("id", user.id)
      .single()

    if (profile) {
      setBankCode(profile.bank_name || "")
      setAccountNumber(profile.bank_account_number || "")
      setAccountHolder(profile.bank_account_holder || "")
      if (profile.bank_name && profile.bank_account_number) {
        generateQR(profile.bank_name, profile.bank_account_number, profile.bank_account_holder)
      }
    }
  }

  const generateQR = (code: string, account: string, holder: string) => {
    // Use a simple format: bankcode|accountnumber|accountholder
    // This can be parsed by mobile banking apps or used as reference
    const qrString = `${code}|${account}|${holder}`
    setQrValue(qrString)
  }

  const handleSave = async () => {
    if (!bankCode || !accountNumber) {
      setError("Vui lòng chọn ngân hàng và nhập số tài khoản")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Không tìm thấy người dùng")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          bank_name: bankCode,
          bank_account_number: accountNumber,
          bank_account_holder: accountHolder,
        })
        .eq("id", user.id)

      if (updateError) throw updateError
      generateQR(bankCode, accountNumber, accountHolder)
      setSuccess("Lưu thông tin ngân hàng thành công!")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement
    if (canvas) {
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = "bank-qr.png"
      link.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin ngân hàng</CardTitle>
        <CardDescription>Thiết lập QR code chuyển khoản để người khác dễ dàng thanh toán</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="bank-select">Chọn ngân hàng</Label>
            <select
              id="bank-select"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Chọn ngân hàng --</option>
              {VIETNAMESE_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-number">Số tài khoản</Label>
            <Input
              id="account-number"
              type="text"
              placeholder="Nhập số tài khoản"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-holder">Chủ tài khoản</Label>
            <Input
              id="account-holder"
              type="text"
              placeholder="Nhập tên chủ tài khoản"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
        </div>

        {qrValue && (
          <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
            <div ref={qrRef}>
              <QRCode value={qrValue} size={256} level="H" includeMargin={true} />
            </div>
            <Button onClick={downloadQR} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Tải QR code
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
      </CardContent>
    </Card>
  )
}
