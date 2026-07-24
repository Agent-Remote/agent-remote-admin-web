import { AlertTriangle, X } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";

type ConfirmRequest = {
  message: string;
  resolve: (confirmed: boolean) => void;
};

const ConfirmContext = createContext<((message: string) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const titleId = useId();
  const confirmButton = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => setRequest({ message, resolve }));
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") settle(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <div className="confirm-layer">
          <button
            aria-label={t("common.cancel")}
            className="confirm-scrim"
            onClick={() => settle(false)}
            type="button"
          />
          <section aria-labelledby={titleId} aria-modal="true" className="confirm-dialog" role="alertdialog">
            <div className="confirm-dialog-icon"><AlertTriangle size={20} /></div>
            <div className="confirm-dialog-copy">
              <h2 id={titleId}>{t("common.confirm")}</h2>
              <p>{request.message}</p>
            </div>
            <button
              aria-label={t("common.cancel")}
              className="confirm-close icon-button"
              onClick={() => settle(false)}
              type="button"
            >
              <X size={17} />
            </button>
            <div className="confirm-actions">
              <button onClick={() => settle(false)} type="button">{t("common.cancel")}</button>
              <button className="danger-button" onClick={() => settle(true)} ref={confirmButton} type="button">
                {t("common.confirm")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside ConfirmProvider");
  return confirm;
}
