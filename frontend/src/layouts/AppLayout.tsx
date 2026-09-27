import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Bell, BookOpenText, CalendarClock, ChartNoAxesCombined, ChevronDown, CircleHelp, Clapperboard, Command, Film, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings2, Sun, Upload, Users, WandSparkles, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { Button } from '../components/ui'
import { authService } from '../services/authService'
import { useDeleteNotification, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { channelService } from '../services/channelService'
import { queryKeys } from '../constants/routes'
import { useVideos } from '../hooks/useVideos'
import { useProfile } from '../hooks/useProfile'
import type { ApiNotification } from '../services/notificationService'
import { getApiError } from '../services/api'

const primaryNav = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Prompt library', path: '/prompts', icon: BookOpenText },
  { label: 'Prompt evolution', path: '/evolution', icon: WandSparkles },
  { label: 'Video studio', path: '/videos', icon: Film },
  { label: 'Upload schedule', path: '/scheduler', icon: CalendarClock },
  { label: 'Upload manager', path: '/uploads', icon: Upload },
  { label: 'Metadata', path: '/metadata', icon: Clapperboard },
  { label: 'Channels', path: '/channels', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: ChartNoAxesCombined },
]

const pageTitles: Record<string, string> = { '/': 'Overview', '/prompts': 'Prompt library', '/evolution': 'Prompt evolution', '/videos': 'Video studio', '/scheduler': 'Upload schedule', '/uploads': 'Upload manager', '/metadata': 'Metadata', '/channels': 'Channels', '/analytics': 'Analytics', '/settings': 'Settings' }

function notificationKind(type: ApiNotification['type']) {
  if (type === 'UPLOAD_SUCCESS') return { title: 'Upload complete', kind: 'success' as const }
  if (type === 'UPLOAD_FAILED') return { title: 'Upload needs attention', kind: 'error' as const }
  if (type === 'VIDEO_GENERATED') return { title: 'Video generated', kind: 'info' as const }
  if (type === 'SCHEDULE_TRIGGERED') return { title: 'Schedule triggered', kind: 'schedule' as const }
  return { title: 'Studio update', kind: 'info' as const }
}
function NotificationPanel({ close }: { close: () => void }) {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const remove = useDeleteNotification()
  const items = notifications.data || []
  const iconTone = { success: 'success', error: 'error', info: 'info', schedule: 'schedule' } as const
  const markAllRead = async () => { await Promise.all(items.filter((item) => !item.read).map((item) => markRead.mutateAsync(item.id))) }
  return <><button className="drawer-scrim" aria-label="Close notifications" onClick={close} /><aside className="notification-drawer"><header className="drawer-header"><div><span className="eyebrow">INBOX</span><h2>Notifications</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={18} /></button></header><div className="drawer-actions"><span>{items.filter((item) => !item.read).length} unread</span><button disabled={markRead.isPending || !items.some((item) => !item.read)} onClick={() => void markAllRead()}>Mark all read</button></div>{notifications.isError && <div className="channel-notice channel-notice-error" role="alert">{getApiError(notifications.error)}</div>}<div className="notification-list">{notifications.isLoading ? <div className="channel-loading">Loading notifications...</div> : items.map((item) => { const view = notificationKind(item.type); return <div key={item.id} className={`notification-item ${item.read ? 'is-read' : ''}`}><button className="notification-main" onClick={() => { if (!item.read) void markRead.mutateAsync(item.id) }}><span className={`notification-icon notification-${iconTone[view.kind]}`}><Activity size={16} /></span><span className="notification-copy"><strong>{view.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small></span>{!item.read && <span className="unread-dot" />}</button><button className="icon-button notification-delete" aria-label="Delete notification" onClick={() => void remove.mutateAsync(item.id)}><X size={13} /></button></div>})}</div><div className="drawer-foot">{items.length ? 'Notifications synced with your workspace.' : 'You’re all caught up with your studio.'}</div></aside></>
}

export function AppLayout() {
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const profile = useProfile()
  const signOut = useAuthStore((state) => state.signOut)
  const theme = useUserStore((state) => state.theme)
  const toggleTheme = useUserStore((state) => state.toggleTheme)
  const notifications = useNotifications()
  const unread = notifications.data?.filter((item) => !item.read).length || 0
  const channelsQuery = useQuery({ queryKey: queryKeys.channels, queryFn: channelService.list })
  const videosQuery = useVideos()
  const activeChannel = channelsQuery.data?.[0]
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Workspace'
  const handleSignOut = async () => {
    try { await authService.logout() } catch { /* Local session still ends if the API is unavailable. */ }
    queryClient.clear()
    signOut()
    navigate('/login')
  }

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-icon"><Command size={19} strokeWidth={2.4} /></div><div className="brand-name">framewise<span>STUDIO</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <button className="workspace-switch" onClick={() => navigate('/channels')}><span className="workspace-avatar">{activeChannel?.avatar || 'Y'}</span><span className="workspace-copy"><strong>{activeChannel?.name || 'YouTube workspace'}</strong><small>{activeChannel ? `${channelsQuery.data?.length || 1} connected channel${channelsQuery.data?.length === 1 ? '' : 's'}` : 'No channel connected'}</small></span><ChevronDown size={15} /></button>
      <div className="nav-label">WORKSPACE</div>
      <nav className="primary-nav">{primaryNav.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} onClick={() => setMobileNav(false)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{path === '/videos' && Boolean(videosQuery.data?.length) && <span className="nav-count">{videosQuery.data?.length}</span>}</NavLink>)}</nav>
      <div className="nav-label secondary-label">PREFERENCES</div><nav className="primary-nav"><NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}><Settings2 size={17} /><span>Settings</span></NavLink><button className="nav-link" onClick={() => setNotificationsOpen(true)}><CircleHelp size={17} /><span>Help & support</span></button></nav>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><WandSparkles size={16} /></div><strong>YouTube connections</strong><p>{channelsQuery.isLoading ? 'Loading channels...' : `${channelsQuery.data?.length || 0} channel${channelsQuery.data?.length === 1 ? '' : 's'} connected to this account.`}</p><button onClick={() => navigate('/channels')}>Manage channels <Plus size={13} /></button></div><button className="user-menu" onClick={() => void handleSignOut()}><span className="user-avatar">{(profile.data?.name || user?.name)?.slice(0, 1) || '?'}</span><span className="user-copy"><strong>{profile.data?.name || user?.name || 'Account'}</strong><small>{profile.data?.role || user?.role || 'user'} role</small></span><LogOut size={15} className="logout-icon" /></button></div>
    </aside>
    <main className="main-shell"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div></div><div className="topbar-actions"><button className="search-trigger" onClick={() => navigate('/prompts')}><Search size={15} /><span>Search prompts...</span></button><button className="icon-button theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button><button className="icon-button notification-trigger" onClick={() => setNotificationsOpen(true)} aria-label="Open notifications"><Bell size={17} />{unread > 0 && <span className="notification-count">{unread}</span>}</button><span className="topbar-divider" /><button className="channel-chip" onClick={() => navigate('/channels')}><span className={activeChannel ? 'channel-dot' : 'muted-dot'} />{activeChannel?.name || 'No channel'}<ChevronDown size={13} /></button><Button size="sm" onClick={() => navigate('/videos')}><Plus size={15} /> Create video</Button></div></header><div className="page-content"><Outlet /></div><footer className="app-footer"><span><span className="live-dot" />API data sync</span><span>Framewise Studio <b>·</b> v1.4.0</span></footer></main>
    {notificationsOpen && <NotificationPanel close={() => setNotificationsOpen(false)} />}
  </div>
}
