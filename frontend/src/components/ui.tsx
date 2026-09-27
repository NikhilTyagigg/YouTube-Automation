import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { RotateCw } from 'lucide-react'
import { cn } from '../utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn('button', `button-${variant}`, `button-${size}`, className)} {...props} />
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>
}

export function Modal({ open, title, children, onClose, size = 'normal' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; size?: 'normal' | 'wide' }) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={cn('modal', size === 'wide' && 'modal-wide')} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header><div className="modal-content">{children}</div></section></div>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-mark">+</span><strong>{title}</strong><p>{detail}</p></div>
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return <div className="loading-rows" aria-label="Loading data">{Array.from({ length: rows }, (_, index) => <div className="loading-row" key={index}><span className="skeleton-block skeleton-thumb" /><span className="skeleton-lines"><i /><i /></span><span className="skeleton-block skeleton-badge" /></div>)}</div>
}

export function ApiErrorState({ title = 'Could not load data', detail, onRetry }: { title?: string; detail: string; onRetry: () => void }) {
  return <div className="api-error-state" role="alert"><strong>{title}</strong><p>{detail}</p><Button variant="secondary" size="sm" onClick={onRetry}><RotateCw size={14} /> Try again</Button></div>
}