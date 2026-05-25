'use client'
// src/app/(app)/bugs/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bug, Plus, Search, Filter, X, Loader2, AlertTriangle, ChevronRight, User, FolderKanban } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ModalNovoBug } from './modal-novo-bug'

const SEVERIDADES = ['Crítico', 'Alto', 'Médio', 'Baixo']
const STATUS_LIST = ['Aberto', 'Em análise', 'Em correção', 'Aguardando reteste', 'Resolvido', 'Fechado', 'Reaberto']

const SEV_BADGE: Record<string, string> = {
  Crítico: 'badge-danger',
  Alto: 'bg-orange-500/15 text-orange-400 border border-orange-500/20 badge',
  Médio: 'badge-warning',
  Baixo: 'badge-muted',
}
const STATUS_BADGE: Record<string, string> = {
  Aberto: 'badge-danger',
  'Em análise': 'badge-warning',
  'Em correção': 'badge-info',
  'Aguardando reteste': 'badge-warning',
  Resolvido: 'badge-success',
  Fechado: 'badge-muted',
  Reaberto: 'badge-danger',
}

export default function BugsPage() {
  const sp = useSearchParams()
  const [bugs, setBugs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState(sp.get('status') || '')
  const [severidade, setSeveridade] = useState(sp.get('severidade') || '')
  const [modalAberto, setModalAberto] = useState(false)
  const [projetos, setProjetos] = useState<any[]>([])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (status) p.set('status', status)
      if (severidade) p.set('severidade', severidade)
      if (sp.get('projeto')) p.set('projeto', sp.get('projeto')!)
      const res = await fetch(`/api/bugs?${p}`)
      const data = await res.json()
      setBugs(data.bugs || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erro ao carregar bugs') }
    finally { setLoading(false) }
  }, [q, status, severidade, sp])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(Array.isArray(d) ? d : []))
  }, [])

  const limparFiltros = () => { setStatus(''); setSeveridade(''); setQ('') }
  const temFiltros = !!(q || status || severidade)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Bugs & Defeitos</h1>
          <p className="text-text-secondary text-sm mt-0.5">{total} bug{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Registrar bug
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar bugs..." className="input-base pl-9" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="input-base w-44 appearance-none cursor-pointer">
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={severidade} onChange={e => setSeveridade(e.target.value)}
          className="input-base w-40 appearance-none cursor-pointer">
          <option value="">Severidade</option>
          {SEVERIDADES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {temFiltros && (
          <button onClick={limparFiltros} className="btn-secondary flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : bugs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
            <Bug className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm">Nenhum bug encontrado</p>
          <button onClick={() => setModalAberto(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Registrar bug
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Severidade</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Projeto</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Responsável</th>
                <th className="text-left px-4 py-3 text-text-muted text-xs font-mono uppercase tracking-wide">Data</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug, i) => (
                <tr key={bug.id}
                  className="border-b border-border last:border-0 hover:bg-bg-elevated transition-colors group cursor-pointer"
                  onClick={() => window.location.href = `/bugs/${bug.id}`}>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">#{bug.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {bug.severidade === 'Crítico' && <AlertTriangle className="w-3.5 h-3.5 text-status-danger flex-shrink-0" />}
                      <span className="text-sm text-text-primary font-medium line-clamp-1 group-hover:text-accent transition-colors">
                        {bug.titulo}
                      </span>
                    </div>
                    {bug._count?.comentarios > 0 && (
                      <span className="text-xs text-text-muted ml-5">{bug._count.comentarios} comentário{bug._count.comentarios > 1 ? 's' : ''}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={SEV_BADGE[bug.severidade] || 'badge-muted'}>{bug.severidade}</span></td>
                  <td className="px-4 py-3"><span className={STATUS_BADGE[bug.status] || 'badge-muted'}>{bug.status}</span></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" />{bug.projeto?.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {bug.responsavel ? (
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <User className="w-3 h-3" />{bug.responsavel.nome}
                      </span>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatDate(bug.criadoEm)}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <ModalNovoBug
          projetos={projetos}
          onClose={() => setModalAberto(false)}
          onCriado={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}