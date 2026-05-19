import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container">
      <h1 style={{ fontSize: 48 }}>404</h1>
      <p style={{ color: 'var(--muted)', fontSize: 20, marginTop: 8 }}>
        Page introuvable.
      </p>
      <p style={{ marginTop: 32 }}>
        <Link href="/">← Retour à l&apos;accueil</Link>
      </p>
    </main>
  );
}
