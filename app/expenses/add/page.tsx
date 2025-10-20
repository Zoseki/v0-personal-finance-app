"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Profile = {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
}

type Split = {
  debtor_id: string
  item_description: string
  amount: string
}

export default function AddExpensePage() {
  const [description, setDescription] = useState("")
  const [splits, setSplits] = useState<Split[]>([{ debtor_id: "", item_description: "", amount: "" }])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [bulkItem, setBulkItem] = useState("")
  const [bulkAmount, setBulkAmount] = useState("")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }

      const { data: profilesData } = await supabase.from("profiles").select("*").order("display_name")

      if (profilesData) {
        setProfiles(profilesData)
      }
    }
    loadData()
  }, [])

  const addSplit = () => {
    setSplits([...splits, { debtor_id: "", item_description: "", amount: "" }])
  }

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index))
    }
  }

  const updateSplit = (index: number, field: keyof Split, value: string) => {
    const newSplits = [...splits]
    newSplits[index][field] = value
    setSplits(newSplits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const validSplits = splits.filter(
        (s) => s.debtor_id && s.item_description && s.amount && Number.parseFloat(s.amount) > 0,
      )

      if (validSplits.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một người với đầy đủ thông tin")
      }

      const total = validSplits.reduce((sum, s) => sum + Number.parseFloat(s.amount), 0)

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          payer_id: currentUserId,
          description: description || "Chi tiêu",
          total_amount: total,
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      const splitsData = validSplits.map((s) => ({
        transaction_id: transaction.id,
        debtor_id: s.debtor_id,
        item_description: s.item_description,
        amount: Number.parseFloat(s.amount),
      }))

      const { error: splitsError } = await supabase.from("transaction_splits").insert(splitsData)

      if (splitsError) throw splitsError

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotal = () => {
    return splits.reduce((sum, s) => sum + (Number.parseFloat(s.amount) || 0), 0)
  }

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    setSelectedPeople(new Set())
    setBulkItem("")
    setBulkAmount("")
  }

  const togglePersonSelection = (personId: string) => {
    const newSelected = new Set(selectedPeople)
    if (newSelected.has(personId)) {
      newSelected.delete(personId)
    } else {
      newSelected.add(personId)
    }
    setSelectedPeople(newSelected)
  }

  const addSelectedPeople = () => {
    if (selectedPeople.size === 0 || !bulkItem || !bulkAmount) return

    const newSplits = Array.from(selectedPeople).map((personId) => ({
      debtor_id: personId,
      item_description: bulkItem,
      amount: bulkAmount,
    }))

    const existingSplits = splits.filter((s) => s.debtor_id || s.item_description || s.amount)
    setSplits([...existingSplits, ...newSplits])

    setIsBulkMode(false)
    setSelectedPeople(new Set())
    setBulkItem("")
    setBulkAmount("")
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thêm chi tiêu mới</CardTitle>
            <CardDescription>Nhập thông tin chi tiêu cho từng người</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Ghi chú chung (tùy chọn)</Label>
                <Input
                  id="description"
                  placeholder="Ví dụ: Ăn trưa ngày 15/1, Mua đồ văn phòng..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <Label>Chi tiết chi tiêu</Label>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant={isBulkMode ? "default" : "outline"}
                      size="sm"
                      onClick={toggleBulkMode}
                      className="flex-1 sm:flex-none"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {isBulkMode ? "Đang chọn nhiều" : "Thêm nhiều người"}
                    </Button>
                    {!isBulkMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSplit}
                        className="flex-1 sm:flex-none bg-transparent"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm người
                      </Button>
                    )}
                  </div>
                </div>

                {isBulkMode && (
                  <Card className="border-2 border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-3">
                        <Label>Chọn người (đã chọn: {selectedPeople.size})</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {profiles.map((profile) => (
                            <div key={profile.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`bulk-${profile.id}`}
                                checked={selectedPeople.has(profile.id)}
                                onCheckedChange={() => togglePersonSelection(profile.id)}
                              />
                              <label
                                htmlFor={`bulk-${profile.id}`}
                                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                                  <AvatarFallback className="text-[10px]">
                                    {profile.display_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{profile.display_name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulk-item">Tên món</Label>
                        <Input
                          id="bulk-item"
                          placeholder="Ví dụ: Cơm trưa, Cafe, Bút..."
                          value={bulkItem}
                          onChange={(e) => setBulkItem(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulk-amount">Số tiền</Label>
                        <Input
                          id="bulk-amount"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={bulkAmount}
                          onChange={(e) => setBulkAmount(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={toggleBulkMode}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={addSelectedPeople}
                          disabled={selectedPeople.size === 0 || !bulkItem || !bulkAmount}
                        >
                          Thêm {selectedPeople.size} người
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isBulkMode &&
                  splits.map((split, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row gap-2 items-start">
                        <div className="flex-1 space-y-2 w-full">
                          <Select
                            value={split.debtor_id}
                            onValueChange={(value) => updateSplit(index, "debtor_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn người" />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                                      <AvatarFallback className="text-[10px]">
                                        {profile.display_name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {profile.display_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Tên món (Ví dụ: Cơm trưa, Cafe...)"
                            value={split.item_description}
                            onChange={(e) => updateSplit(index, "item_description", e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-32">
                          <Input
                            type="number"
                            step="1"
                            placeholder="Số tiền"
                            value={split.amount}
                            onChange={(e) => updateSplit(index, "amount", e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSplit(index)}
                          disabled={splits.length === 1}
                          className="mt-0 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                <div className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Tổng tiền:</span>
                    <span className="font-bold text-lg">{calculateTotal().toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Đang lưu..." : "Lưu chi tiêu"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
