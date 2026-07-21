'use client'

import { useState } from 'react'
import { simulatePayment } from '@/lib/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function CheckoutForm({ transactionId, totalAmount }: { transactionId: string; totalAmount: number }) {
  const [paymentType, setPaymentType] = useState('full')
  const [dpAmount, setDpAmount] = useState(Math.round(totalAmount * 0.3))
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('transactionId', transactionId)
    formData.set('paymentType', paymentType)
    formData.set('amount', String(paymentType === 'full' ? totalAmount : dpAmount))
    const result = await simulatePayment(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v ?? 'full')} className="space-y-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="full" id="pay-full" />
            <Label htmlFor="pay-full">Bayar Penuh — Rp{totalAmount.toLocaleString('id-ID')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="dp" id="pay-dp" />
            <Label htmlFor="pay-dp">Bayar DP (Down Payment)</Label>
          </div>
        </RadioGroup>
      </div>

      {paymentType === 'dp' && (
        <div className="space-y-2">
          <Label htmlFor="dpAmount">Jumlah DP (Rp)</Label>
          <Input
            id="dpAmount"
            type="number"
            min="0"
            value={dpAmount}
            onChange={(e) => setDpAmount(Number(e.target.value))}
            max={totalAmount}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">Bayar Sekarang (Simulasi)</Button>

      <p className="text-xs text-muted-foreground">
        Ini simulasi pembayaran buat keperluan demo — belum terhubung ke payment gateway asli.
      </p>
    </form>
  )
}