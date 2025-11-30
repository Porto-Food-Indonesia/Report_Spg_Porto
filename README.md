# SPG Report System

Sistem Laporan Penjualan SPG (Sales Promotion Girl/Guy) yang memungkinkan SPG dan Admin untuk mengelola laporan penjualan, produk, dan karyawan dengan mudah.

## Fitur

### Login & Authentication
- Login dengan role selection (Admin/SPG)
- Role-based authorization
- Session management

### SPG Dashboard
- Input laporan penjualan harian
- Tracking penjualan per produk
- Riwayat penjualan 30 hari
- Monitor stock pack dan karton
- Notifikasi performa penjualan

### Admin Dashboard
- Analytics dashboard dengan KPI
- Grafik trend penjualan
- Produk paling laris
- Top SPG performer
- Manajemen produk (CRUD)
- Manajemen karyawan (CRUD)
- Export laporan ke Excel

## Teknologi

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts (untuk charts)
- shadcn/ui (untuk components)

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run development server: `npm run dev`
5. Open http://localhost:3000

## Akun Demo

### Admin
- Email: admin@example.com
- Password: admin123

### SPG
- Email: spg@example.com
- Password: spg123

## Database

Saat ini menggunakan mock data. Untuk production, integrasikan dengan database seperti:
- Supabase
- Neon
- PlanetScale

Lihat `/api` routes untuk struktur data yang diperlukan.

## Struktur Folder

\`\`\`
app/
├── api/           # API routes
├── admin/         # Admin dashboard
└── spg/           # SPG dashboard

components/
├── admin/         # Admin components
├── spg/           # SPG components
├── auth/          # Auth components
└── shared/        # Shared components

lib/
├── auth-context.tsx    # Auth context
├── api-client.ts       # API utilities
└── format-utils.ts     # Format utilities
\`\`\`

## Next Steps

1. Integrasikan dengan database asli
2. Implement JWT authentication
3. Add email notifications
4. Setup export to Excel
5. Add dark mode support
6. Implement real-time updates dengan WebSocket
