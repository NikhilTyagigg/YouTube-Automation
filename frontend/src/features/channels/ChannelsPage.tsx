import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Link2, LoaderCircle, MoreHorizontal, Plus, RefreshCw, X } from 'lucide-react'
import { Badge, Button, EmptyState, PageHeading } from '../../components/ui'
import { channelService } from '../../services/channelService'
import { getApiError } from '../../services/api'

export function ChannelsPage() {
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [busyChannel, setBusyChannel] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: list = [], isLoading, isError, error } = useQuery({ queryKey: ['channels'], queryFn: channelService.list, retry: false })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const result = params.get('youtube')
    const error = params.get('youtube_error')
    if (result === 'connected') {
      setNotice('YouTube channel connected successfully.')
      void queryClient.invalidateQueries({ queryKey: ['channels'] })
    } else if (error) setActionError('YouTube authorization was cancelled or could not be completed. Check OAuth settings and try again.')
    if (result || error) navigate(location.pathname, { replace: true })
  }, [location.pathname, location.search, navigate, queryClient])

  async function connectChannel() {
    setConnecting(true)
    setNotice('')
    setActionError('')
    try {
      const url = await channelService.authorizationUrl()
      window.location.assign(url)
    } catch (error) {
      setActionError(getApiError(error))
      setConnecting(false)
    }
  }

  async function runChannelAction(channelId: string, action: 'refresh' | 'disconnect') {
    setBusyChannel(channelId)
    setActionError('')
    setNotice('')
    try {
      if (action === 'refresh') {
        await channelService.refresh(channelId)
        setNotice('YouTube connection refreshed.')
      } else {
        await channelService.disconnect(channelId)
        setNotice('Channel disconnected.')
      }
      await queryClient.invalidateQueries({ queryKey: ['channels'] })
    } catch (error) {
      setActionError(getApiError(error))
    } finally {
      setBusyChannel(null)
    }
  }

  return <>
    <PageHeading eyebrow="ONE STUDIO, MANY STAGES" title="Your channels" description="Connect and manage the YouTube channels that make up your creative world." action={<Button onClick={connectChannel} disabled={connecting}>{connecting ? <LoaderCircle className="spin-icon" size={16} /> : <Plus size={16} />}{connecting ? 'Connecting...' : 'Connect channel'}</Button>} />
    {notice && <div className="channel-notice channel-notice-success" role="status"><CheckCircle2 size={15} />{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    {actionError && <div className="channel-notice channel-notice-error" role="alert"><span>{actionError}</span><button className="icon-button" onClick={() => setActionError('')} aria-label="Dismiss error"><X size={14} /></button></div>}
    <div className="channel-banner"><div className="channel-banner-mark"><Link2 size={18} /></div><div><strong>YouTube account connection</strong><span>Google grants upload and analytics access. Credentials remain on the backend.</span></div><Badge tone="blue">Google OAuth</Badge><button className="text-link" onClick={connectChannel}>Connection settings <ArrowRight size={14} /></button></div>
    <div className="channels-list">
      {isLoading && <div className="panel channel-loading"><LoaderCircle className="spin-icon" size={18} /> Loading connected channels...</div>}
      {isError && <div className="channel-notice channel-notice-error" role="alert"><span>Could not load channels: {getApiError(error)}</span><button className="text-link" onClick={() => void queryClient.invalidateQueries({ queryKey: ['channels'] })}>Retry</button></div>}
      {!isLoading && !isError && list.map((channel) => <article className="channel-card" key={channel.id}>
        <div className="channel-card-main"><span className="channel-avatar">{channel.avatar}</span><div><h2>{channel.name}</h2><span>{channel.email}</span></div><Badge tone={channel.status === 'Connected' ? 'green' : 'amber'}>{channel.status}</Badge></div>
        <div className="channel-card-stats"><div><span>Subscribers</span><strong>{channel.subscribers}</strong></div><div><span>Connected</span><strong>{channel.connected}</strong></div><div><span>Channel state</span><strong>{channel.status}</strong></div></div>
        <div className="channel-card-actions"><button className="text-link" disabled={busyChannel === channel.id} onClick={() => void runChannelAction(channel.id, 'refresh')}><RefreshCw size={14} />{busyChannel === channel.id ? 'Working...' : 'Refresh token'}</button><button className="icon-button danger-hover" title="Disconnect channel" disabled={busyChannel === channel.id} onClick={() => void runChannelAction(channel.id, 'disconnect')}><Link2 size={15} /></button><button className="icon-button" title="More channel actions"><MoreHorizontal size={17} /></button></div>
      </article>)}
      {!isLoading && !isError && list.length === 0 && <EmptyState title="No YouTube channels connected" detail="Connect a Google account to enable scheduled uploads and channel analytics." />}
      <button className="connect-channel-card" onClick={connectChannel} disabled={connecting}><span><Plus size={19} /></span><strong>Add another channel</strong><small>Authorize a YouTube account using Google OAuth.</small></button>
    </div>
  </>
}