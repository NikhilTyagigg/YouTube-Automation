import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowRight, Check, CheckCircle2, ChevronDown, Copy, Eye, Filter, Plus, Play, RefreshCw, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge, Button, EmptyState, LoadingRows, Modal, PageHeading, ApiErrorState } from '../../components/ui'
import { getApiError } from '../../services/api'
import { videoService } from '../../services/videoService'
import { useDeleteVideo, useGenerateVideo, useVideos } from '../../hooks/useVideos'
import { usePrompts } from '../../hooks/usePrompts'
import { useMetadata, useRegenerateMetadata, useSaveMetadata } from '../../hooks/useMetadata'
import type { VideoItem } from '../../types'

const statusTone = { Uploaded: 'green', Processing: 'blue', Generated: 'blue', Pending: 'amber', Failed: 'red' } as const

export function VideosPage() {
  const videoQuery = useVideos()
  const promptsQuery = usePrompts()
  const generateVideo = useGenerateVideo()
  const deleteVideo = useDeleteVideo()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState<VideoItem | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All status')
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [error, setError] = useState('')
  const items = videoQuery.data || []
  const activePrompts = (promptsQuery.data || []).filter((item) => item.active)
  const filtered = items.filter((video) => video.title.toLowerCase().includes(query.toLowerCase()) && (filter === 'All status' || video.status === filter))
  const selectedVideoQuery = useMemo(() => preview, [preview])

  useEffect(() => {
    let objectUrl: string | null = null
    setPreviewUrl(null)
    setPreviewError('')
    if (!preview || !['Generated', 'Uploaded'].includes(preview.status)) return
    void videoService.download(preview.id).then((result) => {
      objectUrl = URL.createObjectURL(result.data)
      setPreviewUrl(objectUrl)
    }).catch((cause) => setPreviewError(getApiError(cause)))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [preview])

  useEffect(() => {
    if (!selectedPrompt && activePrompts[0]) setSelectedPrompt(activePrompts[0].id)
  }, [activePrompts, selectedPrompt])

  const generate = async () => {
    if (!selectedPrompt) { setError('Create and activate a prompt template before generating a video.'); return }
    setError('')
    try { await generateVideo.mutateAsync(selectedPrompt); await queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
    catch (cause) { setError(getApiError(cause)) }
  }
  const download = async (video: VideoItem) => {
    try {
      const response = await videoService.download(video.id)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp4`
      link.click()
      URL.revokeObjectURL(url)
    } catch (cause) { setError(getApiError(cause)) }
  }
  const remove = async (video: VideoItem) => {
    if (!window.confirm(`Delete “${video.title}”?`)) return
    try { await deleteVideo.mutateAsync(video.id) } catch (cause) { setError(getApiError(cause)) }
  }

  return <><PageHeading eyebrow="YOUR PRODUCTION LINE" title="Video studio" description="Review generated cuts, download a preview, and send the keepers on their way." action={<div className="heading-action"><label className="filter-select"><select value={selectedPrompt} onChange={(event) => setSelectedPrompt(event.target.value)} aria-label="Select generation prompt"><option value="">Select prompt</option>{activePrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.name}</option>)}</select><ChevronDown size={14} /></label><Button onClick={() => void generate()} disabled={generateVideo.isPending || !selectedPrompt}>{generateVideo.isPending ? <RefreshCw className="spin-icon" size={15} /> : <Plus size={16} />}{generateVideo.isPending ? 'Starting...' : 'Generate video'}</Button></div>} />{error && <div className="channel-notice channel-notice-error" role="alert">{error}<button className="icon-button" onClick={() => setError('')} aria-label="Dismiss error"><X size={14} /></button></div>}
    <div className="toolbar"><div className="search-field"><Search size={16} /><input placeholder="Find a video..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="filter-select"><Filter size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All status</option><option>Uploaded</option><option>Generated</option><option>Processing</option><option>Pending</option><option>Failed</option></select><ChevronDown size={14} /></label><span className="toolbar-count">{videoQuery.isLoading ? 'Loading...' : `${filtered.length} videos`}</span></div>
    <section className="panel table-panel"><div className="activity-table-wrap"><table className="data-table video-table"><thead><tr><th>VIDEO</th><th>PROMPT USED</th><th>GENERATED</th><th>STATUS</th><th>DURATION</th><th /></tr></thead>{videoQuery.isLoading ? <tbody><tr><td colSpan={6}><LoadingRows /></td></tr></tbody> : <tbody>{filtered.map((video) => <tr key={video.id}><td><div className="video-cell"><button className="thumbnail-wrap" onClick={() => setPreview(video)} aria-label={`Preview ${video.title}`}><span><Play size={14} fill="currentColor" /></span></button><div><strong>{video.title}</strong><span>{video.views} views</span></div></div></td><td><span className="prompt-used">{video.prompt}</span></td><td className="date-cell">{video.date}</td><td><Badge tone={statusTone[video.status]}>{video.status}</Badge></td><td className="duration-cell">{video.duration}</td><td><div className="row-actions"><button className="icon-button" title="View video" onClick={() => setPreview(video)}><Eye size={15} /></button><button className="icon-button" title="Download video" onClick={() => void download(video)}><ArrowDownToLine size={15} /></button><button className="icon-button danger-hover" title="Delete video" onClick={() => void remove(video)}><Trash2 size={15} /></button></div></td></tr>)}</tbody>}</table>{videoQuery.isError && <ApiErrorState detail={getApiError(videoQuery.error)} onRetry={() => void videoQuery.refetch()} />}{!videoQuery.isLoading && !videoQuery.isError && !filtered.length && <EmptyState title="No videos found" detail="Generate a video from an active prompt template to see it here." />}</div></section>
    <Modal open={!!selectedVideoQuery} onClose={() => setPreview(null)} title={selectedVideoQuery?.title || 'Video preview'} size="wide">{selectedVideoQuery && <div className="video-preview"><div className="preview-frame">{previewUrl ? <video src={previewUrl} controls playsInline /> : <div className="preview-placeholder"><Play size={22} /><span>{previewError || (['Generated', 'Uploaded'].includes(selectedVideoQuery.status) ? 'Loading video...' : 'Video is still generating')}</span></div>}<span>{selectedVideoQuery.duration}</span></div>{previewError && <div className="mutation-error" role="alert">{previewError}</div>}<div className="preview-info"><div><span className="eyebrow">PROMPT USED</span><p>{selectedVideoQuery.prompt}</p></div><Badge tone={statusTone[selectedVideoQuery.status]}>{selectedVideoQuery.status}</Badge><Button variant="secondary" onClick={() => void download(selectedVideoQuery)}><ArrowDownToLine size={15} /> Download</Button></div></div>}</Modal>
  </>
}

export function MetadataPage() {
  const videosQuery = useVideos()
  const videos = videosQuery.data || []
  const [selected, setSelected] = useState<string | null>(null)
  const selectedId = selected && videos.some((video) => video.id === selected) ? selected : videos[0]?.id || null
  const metadataQuery = useMetadata(selectedId)
  const saveMetadata = useSaveMetadata(selectedId)
  const regenerate = useRegenerateMetadata(selectedId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setTitle(metadataQuery.data?.title || '')
    setDescription(metadataQuery.data?.description || '')
    setTags(metadataQuery.data?.hashtags || [])
  }, [selectedId, metadataQuery.data])

  const regenerateMetadata = async () => {
    setError('')
    try { await regenerate.mutateAsync() } catch (cause) { setError(getApiError(cause)) }
  }
  const save = async () => {
    if (!selectedId) return
    setError('')
    try { await saveMetadata.mutateAsync({ title, description, hashtags: tags }) } catch (cause) { setError(getApiError(cause)) }
  }
  const copyAll = async () => {
    await navigator.clipboard?.writeText(`${title}\n\n${description}\n\n${tags.map((tag) => `#${tag.replace(/\s/g, '')}`).join(' ')}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <><PageHeading eyebrow="THE DETAILS THAT GET THE CLICK" title="Metadata" description="Fine-tune titles, descriptions, and tags before your video goes live." action={<Button variant="secondary" disabled={!selectedId || regenerate.isPending} onClick={() => void regenerateMetadata()}><Sparkles size={15} />{regenerate.isPending ? 'Regenerating...' : 'Regenerate metadata'}</Button>} />{error && <div className="channel-notice channel-notice-error" role="alert">{error}</div>}<div className="metadata-layout"><div className="metadata-video-list"><span className="eyebrow">SELECT A VIDEO</span>{videosQuery.isLoading && <LoadingRows rows={3} />}{videos.map((item) => <button key={item.id} className={`metadata-video ${item.id === selectedId ? 'metadata-video-active' : ''}`} onClick={() => setSelected(item.id)}><span className="template-glyph"><Play size={14} /></span><span><strong>{item.title}</strong><small>{item.date}</small></span><ChevronDown size={14} /></button>)}</div><div className="metadata-editor"><div className="metadata-editor-head"><div><span className="eyebrow">GENERATED METADATA</span><h2>{videos.find((item) => item.id === selectedId)?.title || 'Select a video'}</h2></div>{metadataQuery.data && <Badge tone="green"><Sparkles size={12} /> API metadata</Badge>}</div>{metadataQuery.isLoading && <LoadingRows rows={4} />}{metadataQuery.isError && <ApiErrorState detail={getApiError(metadataQuery.error)} onRetry={() => void metadataQuery.refetch()} />}{!metadataQuery.isLoading && selectedId && <><div className="metadata-field"><div className="field-head"><label htmlFor="metadata-title">Video title</label><span>{title.length}/100</span></div><input className="text-input" id="metadata-title" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="metadata-field"><div className="field-head"><label htmlFor="metadata-description">Description</label><span>{description.length}/5000</span></div><textarea className="text-input textarea metadata-description" id="metadata-description" value={description} onChange={(event) => setDescription(event.target.value)} /><span className="field-hint">Add useful context, links, and a call to action.</span></div><div className="metadata-field"><div className="field-head"><label>Hashtags</label></div><div className="hashtag-list">{tags.map((tag, index) => <button key={`${tag}-${index}`} onClick={() => setTags((current) => current.filter((_, i) => i !== index))}>#{tag.replace(/^#/, '').replace(/\s/g, '')}<X size={12} /></button>)}<button className="add-hashtag" onClick={() => setTags((current) => [...current, 'new-tag'])}><Plus size={13} /> Add tag</button></div></div><div className="metadata-actions"><span>{metadataQuery.data ? <><CheckCircle2 size={15} /> Last saved {new Date(metadataQuery.data.updatedAt).toLocaleString()}</> : 'No metadata saved yet'}</span><Button variant="secondary" onClick={() => void copyAll()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy all'}</Button><Button onClick={() => void save()} disabled={saveMetadata.isPending}>{saveMetadata.isPending ? 'Saving...' : 'Save metadata'} <ArrowRight size={15} /></Button></div></>}</div></div>{!videosQuery.isLoading && !videos.length && <EmptyState title="No videos available" detail="Generate a video before editing its metadata." />}</>
}
