import Link from "next/link";

const MENU = [
    {
        href: "/settings/account",
        title: "Informasi akun",
        desc: "Nama, username, email, dan nomor telepon",
    },
    {
        href: "/settings/audience",
        title: "Audiens dan penandaan",
        desc: "Siapa yang bisa melihat, membalas, dan menandai Anda",
    },
    {
        href: "/settings/mute-block",
        title: "Mute dan blokir",
        desc: "Kata, akun yang di-mute, dan akun yang diblokir",
    },
    {
        href: "/settings/display",
        title: "Tampilan dan bahasa",
        desc: "Tema, ukuran huruf, dan bahasa",
    },
    {
        href: "/settings/notifications",
        title: "Notifikasi",
        desc: "Atur notifikasi apa saja yang ingin kamu terima",
    },
    ];

    export default function SettingsPage() {
    return (
        <main className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
            <Link href="/home" aria-label="Kembali" className="text-xl">
            ←
            </Link>
            <h1 className="text-xl font-bold text-pink-600">Pengaturan</h1>
        </div>

        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {MENU.map((m) => (
            <li key={m.href}>
                <Link
                href={m.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                <div>
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                <span className="text-gray-400">›</span>
                </Link>
            </li>
            ))}
        </ul>
        </main>
    );
}