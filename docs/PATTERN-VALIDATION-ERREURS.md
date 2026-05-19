# PATTERN-VALIDATION-ERREURS.md — Validation Zod + Server Actions + Popups d'erreurs

> **Pattern obligatoire sur toutes les surfaces (mobile, web admin, landing).**  
> Tous les formulaires = Zod validation → Server Action → ErrorPopup.

---

## 0. Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│ Utilisateur remplit formulaire                      │
└────────────────────┬────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────┐
│ Frontend: FormComponent envoie FormData             │
│ (Client Component, "use client")                    │
└────────────────────┬────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────┐
│ Server Action: reçoit FormData                      │
│ • Valide avec Zod schema                            │
│ • Si ❌ erreur → retourne { success: false, ...errors }
│ • Si ✅ OK → traite + DB + retourne { success: true }
└────────────────────┬────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────┐
│ Frontend: reçoit résultat                           │
│ • Si erreur → ouvre ErrorPopup, affiche messages    │
│ • Si succès → redirige ou confirme                  │
└─────────────────────────────────────────────────────┘
```

**Points clés :**
- **Validation côté serveur OBLIGATOIRE** (même si client a validé)
- **Zod sur toute entrée externe** (formulaire, API, upload)
- **Messages d'erreur génériques** (pas "cet email existe" = risque d'énumération)
- **Popups = affichage lisible** des erreurs utilisateur

---

## 1. Partie 1 : Validation Zod (packages/shared/src/validators/)

### Structure

```
packages/shared/src/validators/
├─ index.ts          ← exports tous les schemas
├─ auth.ts           ← signUp, login, resetPassword
├─ garage.ts         ← createGarage, updateGarage
├─ quote.ts          ← createQuote, createRequest
├─ review.ts         ← submitReview
└─ common.ts         ← emailSchema, phoneSchema, etc.
```

### Exemple : Auth schema (packages/shared/src/validators/auth.ts)

```typescript
import { z } from 'zod';

// Schemas réutilisables
export const emailSchema = z.string().email('Email invalide');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro invalide');
export const passwordSchema = z.string().min(8, 'Minimum 8 caractères');

// Signup
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string(),
  userType: z.enum(['driver', 'mechanic']),
}).refine((d) => d.password === d.passwordConfirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['passwordConfirm'],
});

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

// Reset password
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type SignUp = z.infer<typeof signUpSchema>;
export type Login = z.infer<typeof loginSchema>;
```

### Exemple : Garage schema (packages/shared/src/validators/garage.ts)

```typescript
export const createGarageSchema = z.object({
  garage_name: z.string().min(3, 'Min 3 caractères').max(100),
  city: z.string().min(2, 'Ville requise'),
  phone: phoneSchema,
  email: emailSchema,
  specialties: z.array(z.string()).min(1, 'Au moins une spécialité'),
  opening_hours: z.string().optional(),
});

export const updateGarageSchema = createGarageSchema.partial();

export type CreateGarage = z.infer<typeof createGarageSchema>;
```

---

## 2. Partie 2 : Server Action + validation (apps/web/app/actions/ ou apps/mobile/)

### Structure

```
apps/web/app/
├─ actions/
│  ├─ auth.ts        ← signup, login, resetPassword actions
│  ├─ garage.ts      ← createGarage, updateGarage actions
│  ├─ quote.ts       ← createQuote, submitReview actions
│  └─ types.ts       ← ActionResult<T> type

apps/mobile/src/
├─ services/
│  ├─ auth.service.ts
│  ├─ garage.service.ts
│  └─ quote.service.ts
```

### Exemple : Server Action signature

```typescript
// apps/web/app/actions/types.ts
export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; errors: Record<string, string[]>; message?: string };
```

### Exemple : Auth Server Action (apps/web/app/actions/auth.ts)

```typescript
'use server';

import { signUpSchema, loginSchema } from '@carlink/shared/validators';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { ActionResult } from './types';

export async function signUpAction(
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  const data = Object.fromEntries(formData);

  // 1️⃣ Valider avec Zod
  const result = signUpSchema.safeParse(data);
  
  if (!result.success) {
    // ❌ Erreurs de validation
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 2️⃣ Données validées
  const { email, password, userType } = result.data;

  try {
    const supabase = createServerSupabaseClient();

    // 3️⃣ Vérifier email unique (avant signup)
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return {
        success: false,
        errors: { email: ['Cet email est déjà utilisé'] },
      };
    }

    // 4️⃣ Signup Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { user_type: userType }, // Stocké dans auth.user.user_metadata
      },
    });

    if (authError) {
      return {
        success: false,
        errors: { email: ['Erreur inscription : ' + authError.message] },
      };
    }

    // 5️⃣ ✅ Succès
    return {
      success: true,
      data: { userId: authData.user?.id || '' },
    };
  } catch (error) {
    // ⚠️ Erreur serveur = message générique (pas de détails internes)
    return {
      success: false,
      errors: { _global: ['Une erreur serveur est survenue. Réessayez plus tard.'] },
    };
  }
}

export async function loginAction(
  formData: FormData
): Promise<ActionResult<{ sessionToken: string }>> {
  const data = Object.fromEntries(formData);

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = result.data;

  try {
    const supabase = createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // ⚠️ Email ou password incorrect = message générique
      return {
        success: false,
        errors: { _global: ['Email ou mot de passe incorrect'] },
      };
    }

    return {
      success: true,
      data: { sessionToken: authData.session?.access_token || '' },
    };
  } catch (error) {
    return {
      success: false,
      errors: { _global: ['Erreur serveur'] },
    };
  }
}
```

### Exemple : Garage Server Action (apps/web/app/actions/garage.ts)

```typescript
'use server';

import { createGarageSchema } from '@carlink/shared/validators';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { ActionResult } from './types';

export async function createGarageAction(
  formData: FormData
): Promise<ActionResult<{ garageId: string }>> {
  const data = Object.fromEntries(formData);
  
  const result = createGarageSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { garage_name, city, phone, email, specialties } = result.data;

  try {
    const supabase = createServerSupabaseClient();
    const user = await supabase.auth.getUser();

    if (!user.data.user) {
      return {
        success: false,
        errors: { _global: ['Vous devez être connecté'] },
      };
    }

    // Vérifier unicité phone/email
    const { data: existing } = await supabase
      .from('garages')
      .select('id')
      .or(`phone.eq.${phone}, email.eq.${email}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return {
        success: false,
        errors: {
          phone: ['Ce numéro est déjà utilisé'],
          email: ['Cet email est déjà utilisé'],
        },
      };
    }

    // Créer garage (RLS insère automatiquement owner_id = auth.uid())
    const { data: newGarage, error } = await supabase
      .from('garages')
      .insert({
        garage_name,
        city,
        phone,
        email,
        specialties,
        owner_id: user.data.user.id,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        errors: { _global: ['Erreur création garage'] },
      };
    }

    return {
      success: true,
      data: { garageId: newGarage.id },
    };
  } catch (error) {
    return {
      success: false,
      errors: { _global: ['Erreur serveur'] },
    };
  }
}
```

---

## 3. Partie 3 : Frontend Composants (formulaires + ErrorPopup)

### 3.1 ErrorPopup composant (apps/web/components/ErrorPopup.tsx)

```typescript
'use client';

interface ErrorPopupProps {
  isOpen: boolean;
  errors: Record<string, string[]>;
  onClose: () => void;
}

export function ErrorPopup({ isOpen, errors, onClose }: ErrorPopupProps) {
  if (!isOpen) return null;

  // Aplatir les erreurs { email: ['msg1'], password: ['msg2'] } → ['msg1', 'msg2']
  const messages = Object.values(errors).flat();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>❌ Erreur</h2>
        <ul>
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
```

### 3.2 FormComponent exemple (apps/web/app/auth/signup/page.tsx)

```typescript
'use client';

import { useState } from 'react';
import { signUpAction } from '@/app/actions/auth';
import { ErrorPopup } from '@/components/ErrorPopup';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await signUpAction(formData);

    if (!result.success) {
      setErrors(result.errors);
      setIsOpen(true); // Ouvrir la popup
      setIsLoading(false);
      return;
    }

    // ✅ Succès
    setIsLoading(false);
    router.push('/auth/verify'); // Vérification email
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe (min 8)"
          required
          disabled={isLoading}
        />
        <input
          type="password"
          name="passwordConfirm"
          placeholder="Confirmer mot de passe"
          required
          disabled={isLoading}
        />
        <select name="userType" required disabled={isLoading}>
          <option value="">Sélectionner...</option>
          <option value="driver">Conducteur</option>
          <option value="mechanic">Garage</option>
        </select>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'En cours...' : 'S\'inscrire'}
        </button>
      </form>

      <ErrorPopup
        isOpen={isOpen}
        errors={errors}
        onClose={() => {
          setIsOpen(false);
          setErrors({});
        }}
      />
    </>
  );
}
```

---

## 4. Pattern pour Mobile (Expo + React Native)

### 4.1 Service pattern (apps/mobile/src/services/auth.service.ts)

```typescript
import { signUpSchema, loginSchema } from '@carlink/shared/validators';
import { supabase } from '@carlink/shared/supabase';
import type { ActionResult } from '@carlink/shared/types';

export async function signUpMobileService(
  email: string,
  password: string,
  passwordConfirm: string,
  userType: 'driver' | 'mechanic'
): Promise<ActionResult<{ userId: string }>> {
  const result = signUpSchema.safeParse({
    email,
    password,
    passwordConfirm,
    userType,
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { user_type: userType },
    },
  });

  if (authError) {
    return {
      success: false,
      errors: { _global: ['Erreur inscription'] },
    };
  }

  return {
    success: true,
    data: { userId: authData.user?.id || '' },
  };
}
```

### 4.2 Hook + Modal (apps/mobile/src/hooks/useErrorModal.tsx)

```typescript
import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';

export function useErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const ErrorModal = () => {
    if (!isOpen) return null;

    const messages = Object.values(errors).flat();

    return (
      <Modal visible={isOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'white', margin: 20, padding: 16, borderRadius: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>❌ Erreur</Text>
            <ScrollView>
              {messages.map((msg, i) => (
                <Text key={i} style={{ marginBottom: 8 }}>
                  • {msg}
                </Text>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => {
                setIsOpen(false);
                setErrors({});
              }}
              style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 6, marginTop: 12 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  return {
    ErrorModal,
    showErrors: (errs: Record<string, string[]>) => {
      setErrors(errs);
      setIsOpen(true);
    },
    closeErrors: () => setIsOpen(false),
  };
}
```

### 4.3 Usage dans Screen (apps/mobile/src/screens/SignUpScreen.tsx)

```typescript
import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { signUpMobileService } from '@/services/auth.service';
import { useErrorModal } from '@/hooks/useErrorModal';

export function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [userType, setUserType] = useState<'driver' | 'mechanic'>('driver');
  const [isLoading, setIsLoading] = useState(false);
  const { ErrorModal, showErrors } = useErrorModal();

  async function handleSignUp() {
    setIsLoading(true);

    const result = await signUpMobileService(
      email,
      password,
      passwordConfirm,
      userType
    );

    if (!result.success) {
      showErrors(result.errors);
      setIsLoading(false);
      return;
    }

    // ✅ Succès
    setIsLoading(false);
    // Navigation...
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <TextInput
        placeholder="Confirmer"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        editable={!isLoading}
      />

      <Pressable onPress={handleSignUp} disabled={isLoading}>
        <Text>{isLoading ? 'En cours...' : 'S\'inscrire'}</Text>
      </Pressable>

      <ErrorModal />
    </View>
  );
}
```

---

## 5. Checklist implémentation par surface

### Web Admin
- [ ] Validators Zod pour tous les formulaires (auth, garage, review)
- [ ] Server Actions pour chaque formulaire
- [ ] ErrorPopup composant réutilisable
- [ ] Tous les formulaires utilisent le pattern
- [ ] Tests: validation côté serveur bloque données invalides
- [ ] Tests: messages d'erreur affichés correctement

### Mobile
- [ ] Validators Zod partagés (packages/shared)
- [ ] Services d'authentification avec validation
- [ ] Modal d'erreurs réutilisable
- [ ] Tous les écrans formulaires utilisent le pattern
- [ ] Tests: validation OK sur devices réels
- [ ] Tests: offline mode ne crash pas si service appelle API

### Landing Page
- [ ] Validators Zod pour contact form
- [ ] Server Action pour email send
- [ ] Modal/Toast pour confirmation ou erreur
- [ ] Tests: formulaire soumission valide/invalide

---

## 6. Bonnes pratiques

| Principe | ✅ Faire | ❌ Ne pas faire |
|----------|----------|-----------------|
| **Validation** | Zod côté serveur toujours | Faire confiance au JS client |
| **Messages** | "Email invalide" | "Email format: user@example.com" |
| **Erreur serveur** | Message générique "Erreur serveur" | Exposer détails internes Supabase |
| **RLS check** | Server Action appelle Supabase, RLS valide | Client appelle Supabase sans RLS |
| **Sensible data** | Logger "UPDATE garages: success" | Logger "UPDATE garages SET phone=xxx" |
| **Popup** | Fermer avec bouton OU clic dehors | Obliger utilisateur cliquer |

---

## 7. Roadmap implémentation

Par sprint (voir ROADMAP-TECHNIQUE.md) :

| Sprint | Surface | Formulaires | Tâche |
|--------|---------|------------|-------|
| 1-2 | Admin | (aucun) | Juste Zod validators créés |
| 3-4 | Admin | Auth, Garage CRUD | Implémenter pattern complet |
| 5-6 | Admin | Review moderation | Pattern réutilisé |
| 7-8 | Mobile | Auth | Implémenter services + modal |
| 9-10 | Mobile | Quote, Devis | Services + validation |
| 11 | Mobile | Messages, Payment | Services avec Realtime |
| 13-14 | Landing | Contact form | Pattern simplifié (pas auth) |

---

## Conclusion

**Une seule pattern, partout :**
1. Zod schema (packages/shared)
2. Server Action / Service validation + DB
3. Frontend modal affiche erreurs

**Sécurité obligatoire :**
- ✅ Validation côté serveur
- ✅ Messages génériques (pas d'énumération d'emails)
- ✅ RLS protège DB
- ✅ Jamais exposer détails internes

