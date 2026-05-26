import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastData, ToastVariant } from './Toast';

interface ToastApi {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() doit être utilisé à l'intérieur d'un <ToastProvider>.");
  }
  return ctx;
}

let nextId = 0;
const genId = () => `toast-${++nextId}-${Date.now()}`;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, duration?: number) => {
      const id = genId();
      setToasts((prev) => [...prev, { id, variant, message, duration }]);
    },
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (msg, dur) => push('success', msg, dur),
      error: (msg, dur) => push('error', msg, dur),
      warning: (msg, dur) => push('warning', msg, dur),
      info: (msg, dur) => push('info', msg, dur),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.container, { paddingTop: insets.top + 8 }]}
      >
        {toasts.map((toast, idx) => (
          <Toast
            key={toast.id}
            toast={toast}
            index={idx}
            onDismiss={dismiss}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
});
