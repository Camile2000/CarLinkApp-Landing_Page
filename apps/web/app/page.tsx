export default function Landing() {
  return (
    <main className="container">
      <h1 style={{ fontSize: 48 }}>CarLink</h1>
      <p style={{ color: 'var(--muted)', fontSize: 20, marginTop: 8 }}>
        La plateforme qui relie les conducteurs et les garages au Cameroun.
      </p>
      <p style={{ marginTop: 32 }}>
        Décrivez votre problème, recevez des devis des garages proches,
        choisissez, échangez par chat et notez le service.
      </p>
      <p style={{ marginTop: 32 }}>
        <a href="/admin">→ Accéder au dashboard admin</a>
      </p>
    </main>
  );
}
