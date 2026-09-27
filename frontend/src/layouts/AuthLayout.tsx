import { Outlet } from 'react-router-dom'
import { Command } from 'lucide-react'
import { Badge } from '../components/ui'

export function AuthLayout() {
  return <div className="auth-shell"><div className="auth-art"><div className="auth-art-top"><div className="brand-icon"><Command size={19} strokeWidth={2.4} /></div><span>framewise</span><Badge tone="green">STUDIO</Badge></div><div className="auth-art-copy"><span className="eyebrow">YOUR CREATIVE ENGINE</span><h1>Make the work.<br /><i>Skip the busywork.</i></h1><p>One thoughtful idea, turned into a whole channel. Your AI production studio is ready when you are.</p></div><div className="auth-art-image"><img src="https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1100&auto=format&fit=crop&q=85" alt="A quiet film set with a camera in warm light" /><div className="art-image-caption"><span className="live-dot" />A little more time for the good ideas.</div></div><span className="auth-copyright">© 2025 Framewise Studio</span></div><div className="auth-main"><Outlet /></div></div>
}