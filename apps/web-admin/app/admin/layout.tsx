import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28 }}>CarLink — Admin</h1>
        <nav style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/garages">Garages</Link>
          <Link href="/admin/reviews">Avis</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
