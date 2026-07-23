'use client'

import { useState } from 'react'
import { simulatePayment } from '@/lib/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Wallet, Landmark } from 'lucide-react'

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
    <form action={handleSubmit} className="animate-fade-in-up space-y-4">
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v ?? 'full')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            htmlFor="pay-full"
            className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all ${
              paymentType === 'full' ? 'border-accent-brand ring-1 ring-accent-brand/40' : 'border-border hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5" />
              <RadioGroupItem value="full" id="pay-full" />
            </div>
            <div>
              <p className="text-sm font-medium">Bayar Penuh</p>
              <p className="text-xs text-muted-foreground">Rp{totalAmount.toLocaleString('id-ID')}</p>
            </div>
          </label>

          <label
            htmlFor="pay-dp"
            className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all ${
              paymentType === 'dp' ? 'border-accent-brand ring-1 ring-accent-brand/40' : 'border-border hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <Landmark className="h-5 w-5" />
              <RadioGroupItem value="dp" id="pay-dp" />
            </div>
            <div>
              <p className="text-sm font-medium">Bayar DP</p>
              <p className="text-xs text-muted-foreground">Down Payment sebagian</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {paymentType === 'dp' && (
        <div className="animate-fade-in-up space-y-2">
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90">
        Bayar Sekarang (Simulasi)
      </Button>

      <p className="text-xs text-muted-foreground">
        Ini simulasi pembayaran buat keperluan demo — belum terhubung ke payment gateway asli.
      </p>
    </form>
  )
}