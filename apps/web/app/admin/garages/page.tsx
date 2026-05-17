import { supabase } from '@/lib/supabase';
import type { Garage } from '@carlink/shared';

export const dynamic = 'force-dynamic';

export default async function GaragesAdmin() {
  let garages: Garage[] = [];
  let error: string | null = null;

  try {
    const { data, error: e } = await supabase
      .from('garages')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) throw e;
    garages = (data as Garage[]) ?? [];
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <main>
      <h2 style={{ marginBottom: 16 }}>Garages</h2>
      {error ? (
        <p style={{ color: 'var(--muted)' }}>
          Impossible de charger les garages ({error}). Vérifie la config
          Supabase.
        </p>
      ) : garages.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Aucun garage pour le moment.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Ville</th>
              <th>Certifié</th>
              <th>Docs</th>
              <th>Statut</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {garages.map((g) => (
              <tr key={g.id}>
                <td>{g.garage_name}</td>
                <td>{g.city ?? '—'}</td>
                <td>{g.is_certified ? '✓' : '—'}</td>
                <td>{g.documents_verified ? '✓' : '—'}</td>
                <td>{g.suspended ? 'Suspendu' : 'Actif'}</td>
                <td>
                  {g.rating} ({g.review_count})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ color: 'var(--muted)', marginTop: 24, fontSize: 14 }}>
        Note : certifier / suspendre écrit dans <code>garages.is_certified</code>{' '}
        / <code>garages.suspended</code> (action admin via RLS).
      </p>
    </main>
  );
}
