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
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{'★'.repeat(r.rating)}</td>
                <td>{r.comment ?? '—'}</td>
                <td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
