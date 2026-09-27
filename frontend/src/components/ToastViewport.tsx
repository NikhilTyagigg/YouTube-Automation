import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

export function ToastViewport() {
  const items = useToastStore((state) => state.items)
  const dismiss = useToastStore((state) => state.dismiss)
  return <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">{items.map((item) => <div className={`toast-item toast-${item.tone}`} key={item.id} role={item.tone === 'error' ? 'alert' : 'status'}>{item.tone === 'error' ? <CircleAlert size={16} /> : <CircleCheck size={16} />}<span>{item.message}</span><button className="icon-button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification"><X size={14} /></button></div>)}</div>
}
