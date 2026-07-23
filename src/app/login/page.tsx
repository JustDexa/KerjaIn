'use client'

import { useState } from 'react'
import { signIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AuthLogo } from '@/components/shared/auth-logo'
import { IconInput } from '@/components/shared/icon-input'
import { Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const result = await signIn(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <AuthLogo />
        <Card>
          <CardHeader>
            <CardTitle>Masuk ke akun kamu</CardTitle>
            <CardDescription>Lanjutkan ke KerjaIn buat cari atau tawarin jasa</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <IconInput icon={Mail} id="email" name="email" type="email" placeholder="nama@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <IconInput icon={Lock} id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Masuk</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Belum punya akun? <a href="/register" className="font-medium text-foreground underline underline-offset-4">Daftar</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}