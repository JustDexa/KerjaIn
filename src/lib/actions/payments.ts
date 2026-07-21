'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function simulatePayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactionId = formData.get('transactionId') as string
  const paymentType = formData.get('paymentType') as string // 'full' atau 'dp'
  const amount = Number(formData.get('amount'))

  if (!amount || amount <= 0) {
    return { error: 'Jumlah pembayaran harus lebih dari 0' }
  }

  const { data: transaction } = await supabase
    .from('transactions')
    .select('id, user_id')
    .eq('id', transactionId)
    .single()

  if (!transaction || transaction.user_id !== user.id) {
    return { error: 'Tidak diizinkan' }
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    transaction_id: transactionId,
    amount,
    type: paymentType,
    status: 'success', // simulasi: langsung sukses
    paid_at: new Date().toISOString(),
  })

  if (paymentError) return { error: paymentError.message }

  const newPaymentStatus = paymentType === 'full' ? 'paid' : 'dp_paid'

  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      payment_status: newPaymentStatus,
      status: 'in_progress',
      dp_amount: paymentType === 'dp' ? amount : null,
      scheduled_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (updateError) return { error: updateError.message }

  redirect(`/checkout/${transactionId}`)
}