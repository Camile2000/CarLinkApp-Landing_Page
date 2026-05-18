import { supabase } from '@/lib/supabase';
import type { Review } from '@carlink/shared';

export const dynamic = 'force-dynamic';

export default async function ReviewsAdmin() {
  let reviews: Review[] = [];
  let error: string | null = null;

  try {
    const { data, error: e } = await supabase
      .from('reviews')
      .select('*')
      .order('flagged', { ascending: false })
      .order('created_at', { ascending: false });
    if (e) throw e;
    reviews = (data as Review[]) ?? [];
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <main>
      <h2 style={{ marginBottom: 16 }}>Modération des avis</h2>
      {error ? (
        <p style={{ color: 'var(--muted)' }}>
          Impossible de charger les avis ({error}).
        </p>
      ) : reviews.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Aucun avis pour le moment.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Signalé</th>
              <th>Approuvé</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{'★'.repeat(r.rating)}</td>
                <td>{r.comment ?? '—'}</td>
                <td>{r.flagged ? '⚠️ oui' : '—'}</td>
                <td>{r.approved ? '✓' : 'masqué'}</td>
                <td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ color: 'var(--muted)', marginTop: 24, fontSize: 14 }}>
        Note : rejeter un avis met <code>reviews.approved = false</code> (il
        disparaît de la page publique et la note du garage est recalculée).
      </p>
    </main>
  );
}
