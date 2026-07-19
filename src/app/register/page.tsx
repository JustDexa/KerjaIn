'use client'

import { useState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function RegisterPage() {
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('role', role)
    const result = await signUp(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar ke KerjaIn</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Daftar sebagai</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="user" id="role-user" />
                  <Label htmlFor="role-user">Pelanggan (User)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="umkm" id="role-umkm" />
                  <Label htmlFor="role-umkm">UMKM / Pekerja Lepas</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input id="fullName" name="fullName" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full">Daftar</Button>
          </form>

          <p className="mt-4 text-center text-sm">
            Udah punya akun? <a href="/login" className="underline">Login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}