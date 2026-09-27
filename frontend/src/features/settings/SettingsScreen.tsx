import { useEffect, useState } from 'react'
import { Activity, Check, Link2, Play, Settings2, Upload, WandSparkles } from 'lucide-react'
import { Button, Field, LoadingRows, PageHeading, ApiErrorState } from '../../components/ui'
import { useSettings, useSaveSettings } from '../../hooks/useSettings'
import { channelService } from '../../services/channelService'
import { getApiError } from '../../services/api'
import { queryKeys } from '../../constants/routes'
import { useQuery } from '@tanstack/react-query'

interface SettingsForm {
  uploadTime: string
  timezone: string
  defaultLanguage: string
  defaultDuration: string
  defaultStyle: string
  geminiModel: string
  youtubeChannelId: string | null
  dailyUploadLimit: number
  notifications: boolean
}
const initial: SettingsForm = { uploadTime: '09:00', timezone: 'UTC', defaultLanguage: 'English', defaultDuration: '60 sec', defaultStyle: 'Cinematic', geminiModel: 'gemini-2.0-flash', youtubeChannelId: null, dailyUploadLimit: 3, notifications: true }

export function SettingsScreen() {
  const settingsQuery = useSettings()
  const channelsQuery = useQuery({ queryKey: queryKeys.channels, queryFn: channelService.list })
  const saveMutation = useSaveSettings()
  const [form, setForm] = useState<SettingsForm>(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (settingsQuery.data) setForm({ ...initial, ...settingsQuery.data }) }, [settingsQuery.data])
  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const save = async () => {
    setError('')
    setSaved(false)
    try { await saveMutation.mutateAsync({ ...form }); setSaved(true); window.setTimeout(() => setSaved(false), 2200) }
    catch (cause) { setError(getApiError(cause)) }
  }
  if (settingsQuery.isLoading) return <><PageHeading eyebrow="MAKE THE STUDIO YOURS" title="Settings" description="Manage the defaults stored with your account." /><section className="panel"><LoadingRows rows={6} /></section></>
  if (settingsQuery.isError) return <><PageHeading eyebrow="MAKE THE STUDIO YOURS" title="Settings" description="Manage the defaults stored with your account." /><ApiErrorState detail={getApiError(settingsQuery.error)} onRetry={() => void settingsQuery.refetch()} /></>
  return <><PageHeading eyebrow="MAKE THE STUDIO YOURS" title="Settings" description="Manage generation, channel, upload, and notification defaults stored by the backend." action={<Button onClick={() => void save()} disabled={saveMutation.isPending}>{saved ? <Check size={15} /> : <Check size={15} />}{saveMutation.isPending ? 'Saving...' : saved ? 'Saved' : 'Save changes'}</Button>} />{error && <div className="channel-notice channel-notice-error" role="alert">{error}</div>}
  <div className="settings-layout"><nav className="settings-nav"><a className="settings-nav-active" href="#general"><Settings2 size={16} /> General</a><a href="#gemini"><WandSparkles size={16} /> Gemini</a><a href="#youtube"><Play size={15} /> YouTube</a><a href="#uploads"><Upload size={15} /> Uploads</a><a href="#notifications"><Activity size={15} /> Notifications</a></nav><div className="settings-content"><section className="settings-section" id="general"><div className="settings-section-head"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>General settings</h2><p>Choose defaults used by video generation and scheduled publishing.</p></div></div><div className="settings-form-grid"><Field label="Timezone"><select className="text-input" value={form.timezone} onChange={(event) => update('timezone', event.target.value)}>{['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].map((zone) => <option key={zone}>{zone}</option>)}</select></Field><Field label="Default language"><select className="text-input" value={form.defaultLanguage} onChange={(event) => update('defaultLanguage', event.target.value)}>{['English', 'Spanish', 'French', 'Japanese'].map((language) => <option key={language}>{language}</option>)}</select></Field></div></section><section className="settings-section" id="gemini"><div className="settings-section-head"><span className="settings-section-icon lilac"><WandSparkles size={16} /></span><div><span className="eyebrow">VIDEO GENERATION</span><h2>Gemini configuration</h2><p>The API key stays on the backend and is never exposed in the browser.</p></div></div><div className="settings-form-grid"><Field label="Text model"><input className="text-input" value={form.geminiModel} onChange={(event) => update('geminiModel', event.target.value)} maxLength={150} /></Field><Field label="Default generation duration"><select className="text-input" value={form.defaultDuration} onChange={(event) => update('defaultDuration', event.target.value)}><option>45 sec</option><option>60 sec</option><option>2 min</option><option>3 min</option></select></Field></div><Field label="Default visual style"><input className="text-input" value={form.defaultStyle} onChange={(event) => update('defaultStyle', event.target.value)} maxLength={100} /></Field><div className="connection-state"><span className="muted-dot" /> Credential status is managed by the backend <small>Set GEMINI_API_KEY in backend/.env</small></div></section><section className="settings-section" id="youtube"><div className="settings-section-head"><span className="settings-section-icon coral"><Play size={15} /></span><div><span className="eyebrow">CHANNEL PUBLISHING</span><h2>YouTube configuration</h2><p>Select the channel used for generated upload jobs.</p></div></div><Field label="Default channel"><select className="text-input" value={form.youtubeChannelId || ''} onChange={(event) => update('youtubeChannelId', event.target.value || null)}><option value="">Use first connected channel</option>{(channelsQuery.data || []).map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></Field><div className="connection-state"><span className={channelsQuery.data?.length ? 'live-dot' : 'muted-dot'} />{channelsQuery.data?.length ? `${channelsQuery.data.length} channel(s) available` : 'No YouTube channel connected'}<button onClick={() => window.location.assign('/channels')}><Link2 size={13} /> Manage channels</button></div></section><section className="settings-section" id="uploads"><div className="settings-section-head"><span className="settings-section-icon blue"><Upload size={15} /></span><div><span className="eyebrow">PUBLISHING RHYTHM</span><h2>Upload configuration</h2><p>Set the daily scheduler time and cap.</p></div></div><div className="settings-form-grid"><Field label="Daily upload time"><input type="time" className="text-input" value={form.uploadTime} onChange={(event) => update('uploadTime', event.target.value)} /></Field><Field label="Maximum uploads per day"><select className="text-input" value={form.dailyUploadLimit} onChange={(event) => update('dailyUploadLimit', Number(event.target.value))}><option value={1}>1 upload</option><option value={3}>3 uploads</option><option value={5}>5 uploads</option><option value={10}>10 uploads</option></select></Field></div></section><section className="settings-section" id="notifications"><div className="settings-section-head"><span className="settings-section-icon yellow"><Activity size={15} /></span><div><span className="eyebrow">KEEP IN THE LOOP</span><h2>Notifications</h2><p>Control whether the backend creates workflow notifications.</p></div></div><label className="toggle-row"><span><strong>Workflow notifications</strong><small>Video generation complete, upload status, and scheduler events.</small></span><input type="checkbox" checked={form.notifications} onChange={(event) => update('notifications', event.target.checked)} /></label></section></div></div></>
}
