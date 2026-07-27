import {
  AlertTriangle,
  CheckCircle2,
  X,
  type LucideIcon
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Notice } from "../types";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src="/agent-remote-icon.svg" alt="" />
    </span>
  );
}

export function NoticeBar({
  notice,
  onDismiss,
  dismissLabel = "Dismiss"
}: {
  notice: Notice;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const Icon = notice.kind === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div className={`notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
      <Icon size={16} />
      <span>{notice.message}</span>
      {onDismiss ? (
        <button
          aria-label={dismissLabel}
          className="notice-dismiss"
          onClick={onDismiss}
          title={dismissLabel}
          type="button"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue = "",
  placeholder,
  value,
  onChange
}: {
  name?: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value === undefined ? defaultValue : undefined}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export function TextAreaField({
  name,
  label,
  required = false
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea name={name} required={required} />
    </label>
  );
}

export function SelectField({
  name,
  label,
  required = false,
  value,
  onChange,
  children
}: {
  name: string;
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} required={required} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

export function CheckLine({
  name,
  label,
  defaultChecked = false
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="check-line">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}

export function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

export function PanelTitle({
  icon: Icon,
  title,
  action
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h2>{title}</h2>
      {action ? <div className="panel-title-action">{action}</div> : null}
    </div>
  );
}

export function ResourceRow({
  title,
  meta,
  actions
}: {
  title: React.ReactNode;
  meta: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="resource-row">
      <div className="resource-main">
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      {actions ? <div className="row-actions">{actions}</div> : null}
    </div>
  );
}

export function DetailRow({
  title,
  status,
  meta,
  value
}: {
  title: string;
  status?: string;
  meta: string;
  value: unknown;
}) {
  return (
    <details className="detail-row">
      <summary>
        <span>{title}</span>
        {status ? <StatusPill status={status} /> : null}
        <small>{meta}</small>
      </summary>
      <JsonBlock value={value} />
    </details>
  );
}

export function ResponsiveForm({
  children,
  closeLabel,
  icon: Icon,
  onSubmit,
  triggerLabel
}: {
  children: React.ReactNode;
  closeLabel: string;
  icon: LucideIcon;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button className="mobile-form-trigger primary" onClick={() => setOpen(true)} type="button">
        <Icon size={17} />
        {triggerLabel}
      </button>
      <div className={`responsive-form-layer ${open ? "open" : ""}`}>
        <button
          aria-label={closeLabel}
          className="responsive-form-scrim"
          onClick={() => setOpen(false)}
          type="button"
        />
        <form className="panel form-panel responsive-form" onSubmit={onSubmit}>
          <button
            aria-label={closeLabel}
            className="mobile-form-close icon-button"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
          {children}
        </form>
      </div>
    </>
  );
}

export function copyToClipboard(value: string, onDone: () => void) {
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(value).then(onDone);
    return;
  }
  onDone();
}
