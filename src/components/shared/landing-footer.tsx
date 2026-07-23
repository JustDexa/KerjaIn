import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <span className="text-lg font-bold">KerjaIn</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Professional Reputation Network untuk UMKM & pekerja lepas Solo Raya.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Platform</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works">Cara Kerja</a></li>
              <li><a href="#categories">Kategori</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Untuk UMKM</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register">Daftarkan Usaha</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Perusahaan</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Tim Clairvoyant — BYTESFEST2026</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          © 2026 KerjaIn. Dibuat untuk BYTESFEST2026.
        </div>
      </div>
    </footer>
  )
}
