import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = createServerSupabaseClient();
  const tables = ['users', 'garages', 'quote_requests', 'quotes', 'reviews', 'invoices'] as const;
  const entries = await Promise.all(
    tables.map(async (t) => {
      const { count } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true });
      return [t, count ?? 0] as const;
    })
  );
  return Object.fromEntries(entries) as Record<(typeof tables)[number], number>;
}

export default async function Dashboard() {
  let stats: Record<string, number> | null = null;
  try {
    stats = await getStats();
  } catch {
    stats = null;
  }

  return (
    <main>
      <h2 style={{ marginBottom: 16 }}>Vue d&apos;ensemble</h2>
      {!stats ? (
        <p style={{ color: 'var(--muted)' }}>
          Configure les variables Supabase dans <code>apps/web/.env.local</code>{' '}
          pour afficher les statistiques.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {Object.entries(stats).map(([k, v]) => (
            <div className="card" key={k}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{v}</div>
              <div style={{ color: 'var(--muted)' }}>{k}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
