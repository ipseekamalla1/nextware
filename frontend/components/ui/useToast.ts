"use client";

import { useCallback, useRef, useState } from "react";

export interface ToastState {
  type: "success" | "error";
  message: string;
}

export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: ToastState["type"], message: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ type, message });

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, autoDismissMs);
    },
    [autoDismissMs],
  );

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}
