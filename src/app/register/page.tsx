'use client'

import { useState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AuthLogo } from '@/components/shared/auth-logo'
import { IconInput } from '@/components/shared/icon-input'
import { User, Store, Mail, Lock, IdCard } from 'lucide-react'

export default function RegisterPage() {
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('role', role)
    const result = await signUp(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <AuthLogo />
        <Card>
          <CardHeader>
            <CardTitle>Buat akun baru</CardTitle>
            <CardDescription>Gabung ke KerjaIn sebagai pelanggan atau UMKM</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Daftar sebagai</Label>
                <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-3">
                  <div className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors ${role === 'user' ? 'border-foreground bg-muted/50' : 'border-border'}`}>
                    <User className="h-5 w-5" />
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="user" id="role-user" />
                      <Label htmlFor="role-user" className="cursor-pointer text-sm font-medium">Pelanggan</Label>
                    </div>
                  </div>
                  <div className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors ${role === 'umkm' ? 'border-foreground bg-muted/50' : 'border-border'}`}>
                    <Store className="h-5 w-5" />
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="umkm" id="role-umkm" />
                      <Label htmlFor="role-umkm" className="cursor-pointer text-sm font-medium">UMKM</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <IconInput icon={IdCard} id="fullName" name="fullName" placeholder="Nama lengkap kamu" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <IconInput icon={Mail} id="email" name="email" type="email" placeholder="nama@email.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <IconInput icon={Lock} id="password" name="password" type="password" placeholder="Minimal 6 karakter" required minLength={6} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full">Daftar</Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Udah punya akun? <a href="/login" className="font-medium text-foreground underline underline-offset-4">Login</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}