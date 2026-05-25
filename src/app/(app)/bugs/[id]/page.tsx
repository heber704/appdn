'use client'
// src/app/(app)/bugs/[id]/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Bug, ArrowLeft, Edit2, Save, X, Loader2, AlertCircle,
  Upload, ImageIcon, Trash2, MessageSquare, Send, Clock,
  History, ChevronDown, ChevronUp
} from 'lucide-react'
import { cn, formatDate, formatDateTime, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const SEVERIDADES = ['Crítico', 'Alto', 'Médio', 'Baixo']
const PRIORIDADES = ['Urgente', 'Alta', 'Média', 'Baixa']
const STATUS_LIST = ['Aberto', 'Em análise', 'Em correção', 'Aguardando reteste', 'Resolvido', 'Fechado', 'Reaberto']

const SEV_BADGE: Record<string, string> = {
  Crítico: 'badge-danger', Alto: 'bg-orange-500/15 text-orange-400 border border-orange-500/20 badge',
  Médio: 'badge-warning', Baixo: 'badge-muted',
}
const STATUS_BADGE: Record<string, string> = {
  Aberto: 'badge-danger', 'Em análise': 'badge-warning', 'Em correção': 'badge-info',
  'Aguardando reteste': 'badge-warning', Resolvido: 'badge-success',
  Fechado: 'badge-muted', Reaberto: 'badge-danger',
}

export default function BugDetalhePage() {
  const { id } = useParams()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [bug, setBug] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<any>({})
  const [imagens, setImagens] = useState<any[]>([])
  const [imagemAtiva, setImagemAtiva] = useState<any>(null)
  const [uploadando, setUploadando] = useState(false)
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)

  const carregar = async () => {
    try {
      const res = await fetch(`/api/bugs/${id}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setBug(data)
      setForm({
        titulo: data.titulo, descricao: data.descricao,
        passosReproducao: data.passosReproducao || '',
        resultadoEsperado: data.resultadoEsperado || '',
        resultadoObtido: data.resultadoObtido || '',
        severidade: data.severidade, prioridade: data.prioridade,
        status: data.status, ambiente: data.ambiente || '',
        versaoSistema: data.versaoSistema || '',
      })
      setImagens(data.imagens || [])
    } catch { toast.error('Erro ao carregar bug') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [id])

  const salvar = async () => {
    setSalvando(true)
    try {
      const res = await fetch(`/api/bugs/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setBug((b: any) => ({ ...b, ...data }))
      setEditando(false)
      toast.success('Bug atualizado!')
      carregar()
    } catch { toast.error('Erro ao salvar') }
    finally { setSalvando(false) }
  }

  const uploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    try {
      const fd = new FormData()
      fd.append('imagem', file)
      const res = await fetch(`/api/bugs/${id}/imagens`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setImagens(imgs => [...imgs, data])
      toast.success('Imagem anexada!')
    } catch { toast.error('Erro ao enviar imagem') }
    finally { setUploadando(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const verImagem = async (img: any) => {
    try {
      const res = await fetch(`/api/bugs/${id}/imagens/${img.id}`)
      const data = await res.json()
      setImagemAtiva(data)
    } catch { toast.error('Erro ao carregar imagem') }
  }

  const excluirImagem = async (imgId: number) => {
    try {
      await fetch(`/api/bugs/${id}/imagens/${imgId}`, { method: 'DELETE' })
      setImagens(imgs => imgs.filter(i => i.id !== imgId))
      if (imagemAtiva?.id === imgId) setImagemAtiva(null)
      toast.success('Imagem removida')
    } catch { toast.error('Erro ao remover') }
  }

  const enviarComentario = async () => {
    if (!comentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/bugs/${id}/comentarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: comentario }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setBug((b: any) => ({ ...b, comentarios: [...(b.comentarios || []), data] }))
      setComentario('')
    } catch { toast.error('Erro ao enviar comentário') }
    finally { setEnviandoComentario(false) }
  }

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
  if (!bug) return <div className="text-center py-20 text-text-secondary">Bug não encontrado</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <button onClick={() => router.push('/bugs')}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bugs
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-status-danger/15 border border-status-danger/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bug className="w-5 h-5 text-status-danger" />
          </div>
          <div className="min-w-0 flex-1">
            {editando ? (
              <input value={form.titulo} onChange={set('titulo')} className="input-base text-lg font-display font-bold w-full" />
            ) : (
              <h1 className="font-display text-xl font-bold text-text-primary leading-tight">{bug.titulo}</h1>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-text-muted font-mono text-xs">#{bug.id}</span>
              <span className={SEV_BADGE[bug.severidade] || 'badge-muted'}>{bug.severidade}</span>
              {editando ? (
                <select value={form.status} onChange={set('status')} className="input-base py-0.5 h-6 text-xs w-40">
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span className={STATUS_BADGE[bug.status] || 'badge-muted'}>{bug.status}</span>
              )}
              <span className="text-text-muted text-xs">{bug.projeto?.nome}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {editando ? (
            <>
              <button onClick={() => setEditando(false)} className="btn-secondary flex items-center gap-1.5"><X className="w-4 h-4" />Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex items-center gap-1.5">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-1.5">
              <Edit2 className="w-4 h-4" />Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-4">
          {/* Descrição */}
          <div className="card">
            <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide mb-3">Descrição</h3>
            {editando ? (
              <textarea value={form.descricao} onChange={set('descricao')} rows={4} className="input-base resize-none" />
            ) : (
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{bug.descricao}</p>
            )}
          </div>

          {/* Passos / Resultado */}
          <div className="grid grid-cols-1 gap-4">
            {(editando || bug.passosReproducao) && (
              <div className="card">
                <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide mb-3">Passos para reproduzir</h3>
                {editando ? (
                  <textarea value={form.passosReproducao} onChange={set('passosReproducao')} rows={4}
                    className="input-base resize-none font-mono text-sm" />
                ) : (
                  <pre className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono bg-bg-subtle rounded-lg p-3">
                    {bug.passosReproducao}
                  </pre>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {(editando || bug.resultadoEsperado) && (
                <div className="card">
                  <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide mb-3">Resultado esperado</h3>
                  {editando ? (
                    <textarea value={form.resultadoEsperado} onChange={set('resultadoEsperado')} rows={3} className="input-base resize-none" />
                  ) : <p className="text-text-secondary text-sm">{bug.resultadoEsperado}</p>}
                </div>
              )}
              {(editando || bug.resultadoObtido) && (
                <div className="card">
                  <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide mb-3">Resultado obtido</h3>
                  {editando ? (
                    <textarea value={form.resultadoObtido} onChange={set('resultadoObtido')} rows={3} className="input-base resize-none" />
                  ) : <p className="text-text-secondary text-sm">{bug.resultadoObtido}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Imagens */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />Evidências ({imagens.length})
              </h3>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadImagem} className="hidden" />
                <button onClick={() => fileRef.current?.click()} disabled={uploadando}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  {uploadando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Anexar imagem
                </button>
              </div>
            </div>
            {imagens.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/40 transition-colors"
                onClick={() => fileRef.current?.click()}>
                <ImageIcon className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">Clique para anexar imagens</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {imagens.map(img => (
                  <div key={img.id} className="relative group">
                    <button onClick={() => verImagem(img)}
                      className="w-full aspect-video bg-bg-elevated rounded-lg border border-border flex items-center justify-center hover:border-accent/40 transition-all overflow-hidden">
                      <ImageIcon className="w-5 h-5 text-text-muted" />
                      <span className="text-xs text-text-muted ml-1 truncate max-w-[80px]">{img.nome}</span>
                    </button>
                    <button onClick={() => excluirImagem(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-status-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comentários */}
          <div className="card">
            <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Comentários ({bug.comentarios?.length || 0})
            </h3>
            <div className="space-y-3 mb-4">
              {(bug.comentarios || []).map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent">{c.usuario.nome[0]}</span>
                  </div>
                  <div className="flex-1 bg-bg-subtle rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">{c.usuario.nome}</span>
                      <span className="text-xs text-text-muted">{timeAgo(c.criadoEm)}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={comentario} onChange={e => setComentario(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario() } }}
                placeholder="Adicionar comentário..." className="input-base flex-1" />
              <button onClick={enviarComentario} disabled={!comentario.trim() || enviandoComentario}
                className="btn-primary flex items-center gap-1.5 px-4">
                {enviandoComentario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Histórico */}
          {bug.historico?.length > 0 && (
            <div className="card">
              <button onClick={() => setHistoricoAberto(v => !v)}
                className="w-full flex items-center justify-between text-xs text-text-muted uppercase tracking-wide font-display font-semibold">
                <span className="flex items-center gap-2"><History className="w-3.5 h-3.5" />Histórico ({bug.historico.length})</span>
                {historicoAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {historicoAberto && (
                <div className="mt-3 space-y-2">
                  {bug.historico.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      <span className="text-text-muted">{formatDateTime(h.alteradoEm)}</span>
                      <span className="font-mono font-medium text-text-primary">{h.campo}</span>
                      <span className="text-text-muted">alterado de</span>
                      <span className="font-mono bg-bg-elevated px-1 rounded">{h.valorAntes || '—'}</span>
                      <span className="text-text-muted">para</span>
                      <span className="font-mono bg-accent/10 text-accent px-1 rounded">{h.valorDepois}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-xs text-text-muted uppercase tracking-wide">Detalhes</h3>
            <InfoRow label="Severidade">
              {editando ? (
                <select value={form.severidade} onChange={set('severidade')} className="input-base text-sm">
                  {SEVERIDADES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <span className={SEV_BADGE[bug.severidade] || 'badge-muted'}>{bug.severidade}</span>}
            </InfoRow>
            <InfoRow label="Prioridade">
              {editando ? (
                <select value={form.prioridade} onChange={set('prioridade')} className="input-base text-sm">
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : <span className="badge-muted">{bug.prioridade}</span>}
            </InfoRow>
            <InfoRow label="Projeto">
              <a href={`/projetos/${bug.projetoId}`} className="text-sm text-accent hover:text-accent-hover">
                {bug.projeto?.nome}
              </a>
            </InfoRow>
            <InfoRow label="Reportado por">
              <span className="text-sm text-text-primary">{bug.reportadoPor?.nome}</span>
            </InfoRow>
            <InfoRow label="Responsável">
              <span className="text-sm text-text-primary">{bug.responsavel?.nome || <span className="text-text-muted italic">Não atribuído</span>}</span>
            </InfoRow>
            {(editando || bug.ambiente) && (
              <InfoRow label="Ambiente">
                {editando ? (
                  <input value={form.ambiente} onChange={set('ambiente')} className="input-base text-sm" />
                ) : <span className="text-sm text-text-secondary font-mono">{bug.ambiente}</span>}
              </InfoRow>
            )}
            {(editando || bug.versaoSistema) && (
              <InfoRow label="Versão">
                {editando ? (
                  <input value={form.versaoSistema} onChange={set('versaoSistema')} className="input-base text-sm" />
                ) : <span className="text-sm text-text-secondary font-mono">{bug.versaoSistema}</span>}
              </InfoRow>
            )}
            <InfoRow label="Criado em">
              <span className="text-sm text-text-muted">{formatDate(bug.criadoEm)}</span>
            </InfoRow>
            <InfoRow label="Atualizado">
              <span className="text-sm text-text-muted">{timeAgo(bug.atualizadoEm)}</span>
            </InfoRow>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {imagemAtiva && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImagemAtiva(null)}>
          <div className="relative max-w-4xl max-h-full">
            <img src={imagemAtiva.data} alt={imagemAtiva.nome}
              className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-4 py-2 flex items-center justify-between">
              <span className="text-white text-sm">{imagemAtiva.nome}</span>
              <button onClick={e => { e.stopPropagation(); excluirImagem(imagemAtiva.id) }}
                className="text-status-danger text-sm flex items-center gap-1 hover:text-red-300">
                <Trash2 className="w-4 h-4" />Remover
              </button>
            </div>
            <button onClick={() => setImagemAtiva(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-text-muted text-xs mb-1">{label}</p>
      {children}
    </div>
  )
}
