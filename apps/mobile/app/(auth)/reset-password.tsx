import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';

// Cible du deeplink "carlink://reset-password" envoyé par Supabase
// dans le mail de réinitialisation. Si le user clique le lien plutôt
// que d'entrer le code, Supabase pose la session puis ouvre cette route.
// On vérifie qu'une session existe (sinon retour signin) et on enchaîne
// vers le formulaire de nouveau mot de passe.
export default function ResetPasswordScreen() {
  useEffect(() => {
    let cancelled = false;

    const proceed = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        router.replace('/(auth)/new-password');
      } else {
        router.replace('/(auth)/signin');
      }
    };

    void proceed();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
