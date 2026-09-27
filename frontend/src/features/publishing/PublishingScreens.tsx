import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CalendarDays, Check, CheckCircle2, ChevronDown, Clock3, FileText, Play, RefreshCw, Search, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, LoadingRows, Modal, PageHeading, ApiErrorState } from '../../components/ui'
import { getApiError } from '../../services/api'
import { queryKeys } from '../../constants/routes'
import { useCancelUpload, useRetryUpload, useUploads } from '../../hooks/useUploads'
import { useUploadLogs } from '../../hooks/useUploads'
import { useSettings, useSaveSettings } from '../../hooks/useSettings'
import { channelService } from '../../services/channelService'
import type { ApiUpload } from '../../services/uploadService'
import type { UploadStatus } from '../../types'

const statusName: Record<UploadStatus, string> = { PENDING: 'Pending', PROCESSING: 'Processing', SUCCESS: 'Uploaded', FAILED: 'Failed' }
const statusTone: Record<UploadStatus, 'green' | 'blue' | 'amber' | 'red'> = { PENDING: 'amber', PROCESSING: 'blue', SUCCESS: 'green', FAILED: 'red' }
const uploadTitle = (item: ApiUpload) => item.video.metadata?.title || item.video.videoName

export function SchedulerPage() {
  const settingsQuery = useSettings()
  const uploadsQuery = useUploads()
  const channelsQuery = useQuery({ queryKey: queryKeys.channels, queryFn: channelService.list })
  const saveSettings = useSaveSettings()
  const [time, setTime] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)
  const [error, setError] = useState('')
  const settings = settingsQuery.data as { uploadTime?: string; timezone?: string; dailyUploadLimit?: number; youtubeChannelId?: string | null } | undefined
  const currentTime = time ?? settings?.uploadTime ?? '09:00'
  const currentTimezone = timezone ?? settings?.timezone ?? 'UTC'
  const uploads = uploadsQuery.data || []
  const save = async () => {
    setError('')
    try { await saveSettings.mutateAsync({ uploadTime: currentTime, timezone: currentTimezone }) }
    catch (cause) { setError(getApiError(cause)) }
  }
  return <><PageHeading eyebrow="PUBLISH ON YOUR TERMS" title="Upload schedule" description="Set the daily generation and publishing window for your connected channel." action={<Button onClick={() => void save()} disabled={saveSettings.isPending || settingsQuery.isLoading}>{saveSettings.isPending ? 'Saving...' : <><Check size={15} /> Save schedule</>}</Button>} />{error && <div className="channel-notice channel-notice-error" role="alert">{error}</div>}{settingsQuery.isLoading && <section className="panel"><LoadingRows rows={2} /></section>}{settingsQuery.isError && <ApiErrorState detail={getApiError(settingsQuery.error)} onRetry={() => void settingsQuery.refetch()} />}{!settingsQuery.isLoading && settings && <><div className="scheduler-topline"><div className="scheduler-kpi"><span className="scheduler-kpi-icon"><CalendarDays size={17} /></span><div><span>Daily upload time</span><strong>{currentTime} · {currentTimezone}</strong></div></div><div className="timezone-note"><Clock3 size={14} />Daily cap: {settings.dailyUploadLimit ?? 3}<i>·</i>{channelsQuery.data?.length ?? 0} connected channels</div></div><div className="schedule-grid"><article className="schedule-card"><div className="schedule-card-top"><span className="schedule-icon daily"><CalendarDays size={17} /></span><Badge tone="blue">Backend setting</Badge></div><span className="eyebrow">DAILY UPLOAD</span><h2>Daily channel schedule</h2><div className="schedule-time"><Clock3 size={16} /><strong>{currentTime}</strong><span>Every day</span></div><div className="schedule-channel"><span className="channel-dot" />{channelsQuery.data?.find((channel) => channel.id === settings.youtubeChannelId)?.name || channelsQuery.data?.[0]?.name || 'No channel selected'}<ChevronDown size={13} /></div><div className="schedule-foot"><span><span className="live-dot" />Saved in account settings</span></div></article><article className="panel settings-schedule-form"><Field label="Upload time"><input type="time" className="text-input" value={currentTime} onChange={(event) => setTime(event.target.value)} /></Field><Field label="Timezone"><select className="text-input" value={currentTimezone} onChange={(event) => setTimezone(event.target.value)}>{['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].map((item) => <option key={item}>{item}</option>)}</select></Field><span className="field-hint">The backend currently supports one daily time per account. Additional schedules require a schedule API.</span></article></div><section className="panel upcoming-panel"><div className="panel-heading"><div><span className="eyebrow">UPCOMING UPLOADS</span><h2>Queue</h2></div><button className="text-link" onClick={() => void uploadsQuery.refetch()}>Refresh queue <RefreshCw size={14} /></button></div>{uploadsQuery.isLoading ? <LoadingRows rows={3} /> : uploadsQuery.isError ? <ApiErrorState detail={getApiError(uploadsQuery.error)} onRetry={() => void uploadsQuery.refetch()} /> : uploads.length ? <div className="upcoming-list">{uploads.slice(0, 8).map((item) => <div className="upcoming-row" key={item.id}><span className="upcoming-date">{new Date(item.scheduledTime).toLocaleDateString()}</span><strong>{new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><span className="upcoming-title"><span className="mini-play"><Play size={11} fill="currentColor" /></span>{uploadTitle(item)}</span><span className="upcoming-channel">{item.channel.channelName}</span><Badge tone={statusTone[item.status]}>{statusName[item.status]}</Badge></div>)}</div> : <EmptyState title="No uploads scheduled" detail="Generated videos connected to a YouTube channel will appear here." />}</section></>}</>
}

export function UploadsPage() {
  const uploadsQuery = useUploads()
  const retryUpload = useRetryUpload()
  const cancelUpload = useCancelUpload()
  const client = useQueryClient()
  const [tab, setTab] = useState('Upload queue')
  const [logsId, setLogsId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const logsQuery = useUploadLogs(logsId)
  const all = uploadsQuery.data || []
  const groups = ['Upload queue', 'Published', 'Failed']
  const groupItems = (group: string) => all.filter((item) => group === 'Upload queue' ? ['PENDING', 'PROCESSING'].includes(item.status) : group === 'Published' ? item.status === 'SUCCESS' : item.status === 'FAILED')
  const filtered = groupItems(tab).filter((item) => uploadTitle(item).toLowerCase().includes(query.toLowerCase()))
  const doAction = async (id: string, action: 'retry' | 'cancel') => {
    setError('')
    try { await (action === 'retry' ? retryUpload.mutateAsync(id) : cancelUpload.mutateAsync(id)) }
    catch (cause) { setError(getApiError(cause)) }
  }
  const markLogs = (id: string) => { setLogsId(id); void client.invalidateQueries({ queryKey: [...queryKeys.uploads, id, 'logs'] }) }
  return <><PageHeading eyebrow="FROM READY TO LIVE" title="Upload manager" description="Keep every upload moving, and catch the few that need a little help." action={<Button variant="secondary" onClick={() => void uploadsQuery.refetch()}><RefreshCw size={15} /> Refresh queue</Button>} />{error && <div className="channel-notice channel-notice-error" role="alert">{error}</div>}<div className="upload-summary"><div><span className="summary-icon blue"><Clock3 size={16} /></span><span><strong>{all.filter((item) => ['PENDING', 'PROCESSING'].includes(item.status)).length}</strong><small>In queue</small></span></div><div><span className="summary-icon green"><CheckCircle2 size={16} /></span><span><strong>{all.filter((item) => item.status === 'SUCCESS').length}</strong><small>Published</small></span></div><div><span className="summary-icon red"><Activity size={16} /></span><span><strong>{all.filter((item) => item.status === 'FAILED').length}</strong><small>Need attention</small></span></div><div className="upload-health"><span className="live-dot" /> Live queue</div></div><div className="toolbar upload-toolbar"><div className="tab-switch">{groups.map((name) => <button key={name} className={tab === name ? 'tab-active' : ''} onClick={() => setTab(name)}>{name}<span>{groupItems(name).length}</span></button>)}</div><div className="search-field"><Search size={15} /><input placeholder="Search uploads..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><section className="panel table-panel"><div className="activity-table-wrap"><table className="data-table uploads-table"><thead><tr><th>VIDEO</th><th>CHANNEL</th><th>STATUS</th><th>SCHEDULED</th><th>UPDATED</th><th /></tr></thead>{uploadsQuery.isLoading ? <tbody><tr><td colSpan={6}><LoadingRows /></td></tr></tbody> : <tbody>{filtered.map((item) => <tr key={item.id}><td><div className="video-cell"><span className="template-glyph"><Play size={14} /></span><div><strong>{uploadTitle(item)}</strong><span>{item.video.duration} · attempt {item.attempts}</span></div></div></td><td><span className="channel-inline"><span className="channel-dot" />{item.channel.channelName}</span></td><td><Badge tone={statusTone[item.status]}>{statusName[item.status]}</Badge></td><td className="date-cell">{new Date(item.scheduledTime).toLocaleString()}</td><td className="date-cell">{item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : item.errorMessage || '—'}</td><td><div className="row-actions">{item.status === 'FAILED' && <button className="icon-button" title="Retry upload" disabled={retryUpload.isPending} onClick={() => void doAction(item.id, 'retry')}><RefreshCw size={15} /></button>}{['PENDING', 'PROCESSING'].includes(item.status) && <button className="icon-button" title="Cancel upload" disabled={cancelUpload.isPending} onClick={() => void doAction(item.id, 'cancel')}><X size={15} /></button>}<button className="icon-button" title="View upload logs" onClick={() => markLogs(item.id)}><FileText size={15} /></button></div></td></tr>)}</tbody>}</table>{uploadsQuery.isError && <ApiErrorState detail={getApiError(uploadsQuery.error)} onRetry={() => void uploadsQuery.refetch()} />}{!uploadsQuery.isLoading && !uploadsQuery.isError && !filtered.length && <EmptyState title="All clear here" detail="There are no uploads in this list right now." />}</div></section><Modal open={Boolean(logsId)} onClose={() => setLogsId(null)} title="Upload activity"><div className="log-view">{logsQuery.isLoading ? <LoadingRows rows={2} /> : logsQuery.isError ? <ApiErrorState detail={getApiError(logsQuery.error)} onRetry={() => void logsQuery.refetch()} /> : <div className="log-events">{(logsQuery.data || []).map((entry, index) => <div key={`${entry.at}-${index}`}><span>{new Date(entry.at).toLocaleTimeString()}</span><p>{entry.status}: {entry.message}</p></div>)}</div>}</div></Modal></>
}
