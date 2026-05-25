'use client'
// src/app/(app)/projetos/page.tsx
import { useState, useEffect, useCallback } from 'react'
import {
  FolderKanban, Plus, Search, Filter, Bug, TestTube2,
  RotateCcw, Calendar, ChevronRight, Loader2, X, AlertCircle
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Projeto {
  id: number
  nome: string
  descricao: string | null
  status: string
  dataInicio: string
  dataPrevisao: string | null
  _count: { bugs: number; casosTeste: number; ciclos: number }
}

const STATUS_OPTS = ['Em andamento', 'Planejado', 'Pausado', 'Concluído', 'Cancelado']

const STATUS_BADGE: Record<string, string> = {
  'Em andamento': 'badge-success',
  'Planejado':    'badge-info',
  'Pausado':      'badge-warning',
  'Concluído':    'badge-muted',
  'Cancelado':    'badge-danger',
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (filtroStatus) params.set('status', filtroStatus)
      const res = await fetch(`/api/projetos?${params}`)
      const data = await res.json()
      setProjetos(Array.isArray(data) ? data : [])
    } catch { toast.error('Erro ao carregar projetos') }
    finally { setLoading(false) }
  }, [q, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Projetos</h1>
          <p className="text-text-secondary text-sm mt-0.5">{projetos.length} projeto{projetos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo projeto
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar projetos..." className="input-base pl-9" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="input-base pl-9 pr-8 appearance-none cursor-pointer">
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {filtroStatus && (
          <button onClick={() => setFiltroStatus('')} className="btn-secondary flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : projetos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm">Nenhum projeto encontrado</p>
          <button onClick={() => setModalAberto(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projetos.map(p => <ProjetoCard key={p.id} projeto={p} />)}
        </div>
      )}

      {modalAberto && (
        <ModalNovoProjeto
          onClose={() => setModalAberto(false)}
          onCriado={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}

function ProjetoCard({ projeto }: { projeto: Projeto }) {
  return (
    <a href={`/projetos/${projeto.id}`}
      className="card hover:border-border-strong transition-all group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-display font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {projeto.nome}
          </h3>
        </div>
        <span className={STATUS_BADGE[projeto.status] || 'badge-muted'}>{projeto.status}</span>
      </div>

      {projeto.descricao && (
        <p className="text-text-secondary text-sm mb-3 line-clamp-2">{projeto.descricao}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
        <span className="flex items-center gap-1"><Bug className="w-3.5 h-3.5" />{projeto._count.bugs} bugs</span>
        <span className="flex items-center gap-1"><TestTube2 className="w-3.5 h-3.5" />{projeto._count.casosTeste} casos</span>
        <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />{projeto._count.ciclos} ciclos</span>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-3">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(projeto.dataInicio)}</span>
        {projeto.dataPrevisao && <span>Previsão: {formatDate(projeto.dataPrevisao)}</span>}
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  )
}

function ModalNovoProjeto({ onClose, onCriado }: { onClose: () => void; onCriado: () => void }) {
  const [form, setForm] = useState({
    nome: '', descricao: '', status: 'Em andamento',
    dataInicio: new Date().toISOString().split('T')[0], dataPrevisao: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome obrigatório'); return }
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error); return }
      toast.success('Projeto criado!')
      onCriado()
    } catch { setErro('Erro ao criar projeto') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-elevated animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-text-primary">Novo projeto</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input type="text" value={form.nome} onChange={set('nome')} placeholder="Nome do projeto" className="input-base" autoFocus />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea value={form.descricao} onChange={set('descricao')} placeholder="Descreva o projeto..." rows={3} className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={set('status')} className="input-base appearance-none cursor-pointer">
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Início *</label>
              <input type="date" value={form.dataInicio} onChange={set('dataInicio')} className="input-base" />
            </div>
          </div>
          <div>
            <label className="label">Previsão de entrega</label>
            <input type="date" value={form.dataPrevisao} onChange={set('dataPrevisao')} className="input-base" />
          </div>
          {erro && (
            <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2 text-sm text-status-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />{erro}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={salvar} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Criando...</> : <><Plus className="w-4 h-4" />Criar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}