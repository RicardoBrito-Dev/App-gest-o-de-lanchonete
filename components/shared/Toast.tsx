'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastListener: ((toast: ToastMessage) => void) | null = null;
let toastCounter = 1;

export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  if (toastListener) {
    toastListener({ id: toastCounter++, text, type });
  }
}

export default function Toast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3200);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
