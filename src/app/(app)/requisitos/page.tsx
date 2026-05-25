'use client'
// src/app/(app)/requisitos/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Search, Filter, X, Loader2, AlertCircle, Bug, TestTube2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Projeto { id: number; nome: string }
interface Requisito {
  id: number
  codigo: string
  titulo: string
  descricao: string | null
  tipo: string
  status: string
  projeto: { id: number; nome: string }
  _count: { casosTeste: number; bugs: number }
}

const TIPOS = ['Funcional', 'Não Funcional', 'Negócio', 'Técnico']
const STATUS_LIST = ['Pendente', 'Aprovado', 'Reprovado', 'Em revisão']

const TIPO_BADGE: Record<string, string> = {
  'Funcional':     'badge-info',
  'Não Funcional': 'badge-warning',
  'Negócio':       'badge-success',
  'Técnico':       'badge-muted',
}

const STATUS_BADGE: Record<string, string> = {
  'Pendente':   'badge-warning',
  'Aprovado':   'badge-success',
  'Reprovado':  'badge-danger',
  'Em revisão': 'badge-info',
}

export default function RequisitosPage() {
  const [requisitos, setRequisitos] = useState<Requisito[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroProjeto, setFiltroProjeto] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroProjeto) params.set('projeto', filtroProjeto)
      const res = await fetch(`/api/requisitos?${params}`)
      const data = await res.json()
      setRequisitos(Array.isArray(data) ? data : [])
    } catch { toast.error('Erro ao carregar requisitos') }
    finally { setLoading(false) }
  }, [q, filtroTipo, filtroStatus, filtroProjeto])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(Array.isArray(d) ? d : []))
  }, [])

  const limparFiltros = () => { setFiltroTipo(''); setFiltroStatus(''); setFiltroProjeto('') }
  const temFiltros = filtroTipo || filtroStatus || filtroProjeto

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Requisitos</h1>
          <p className="text-text-secondary text-sm mt-0.5">{requisitos.length} requisito{requisitos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo requisito
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar requisitos..." className="input-base pl-9" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <select value={filtroProjeto} onChange={e => setFiltroProjeto(e.target.value)}
            className="input-base pl-9 pr-8 appearance-none cursor-pointer">
            <option value="">Todos os projetos</option>
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="input-base appearance-none cursor-pointer">
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="input-base appearance-none cursor-pointer">
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {temFiltros && (
          <button onClick={limparFiltros} className="btn-secondary flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : requisitos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
            <FileText className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm">Nenhum requisito encontrado</p>
          <button onClick={() => setModalAberto(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Criar primeiro requisito
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-elevated">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Código</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Título</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Projeto</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Vínculos</th>
              </tr>
            </thead>
            <tbody>
              {requisitos.map((r, i) => (
                <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-bg-elevated/50 transition-colors ${i % 2 === 0 ? '' : 'bg-bg-elevated/20'}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-bg-elevated border border-border px-2 py-0.5 rounded text-text-secondary">
                      {r.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{r.titulo}</p>
                      {r.descricao && <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{r.descricao}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.projeto.nome}</td>
                  <td className="px-4 py-3">
                    <span className={TIPO_BADGE[r.tipo] || 'badge-muted'}>{r.tipo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[r.status] || 'badge-muted'}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><TestTube2 className="w-3.5 h-3.5" />{r._count.casosTeste}</span>
                      <span className="flex items-center gap-1"><Bug className="w-3.5 h-3.5" />{r._count.bugs}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <ModalNovoRequisito
          projetos={projetos}
          onClose={() => setModalAberto(false)}
          onCriado={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}

function ModalNovoRequisito({ projetos, onClose, onCriado }: { projetos: Projeto[]; onClose: () => void; onCriado: () => void }) {
  const [form, setForm] = useState({ codigo: '', titulo: '', descricao: '', tipo: 'Funcional', status: 'Pendente', projetoId: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const salvar = async () => {
    if (!form.titulo.trim()) { setErro('Título obrigatório'); return }
    if (!form.codigo.trim()) { setErro('Código obrigatório'); return }
    if (!form.projetoId) { setErro('Projeto obrigatório'); return }
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/requisitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projetoId: Number(form.projetoId) }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar'); return }
      toast.success('Requisito criado!')
      onCriado()
    } catch { setErro('Erro ao criar requisito') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-elevated animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-text-primary">Novo requisito</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código *</label>
              <input type="text" value={form.codigo} onChange={set('codigo')} placeholder="REQ-001" className="input-base" autoFocus />
            </div>
            <div>
              <label className="label">Projeto *</label>
              <select value={form.projetoId} onChange={set('projetoId')} className="input-base appearance-none cursor-pointer">
                <option value="">Selecione...</option>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Título *</label>
            <input type="text" value={form.titulo} onChange={set('titulo')} placeholder="Descreva o requisito" className="input-base" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea value={form.descricao} onChange={set('descricao')} placeholder="Detalhes adicionais..." rows={3} className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select value={form.tipo} onChange={set('tipo')} className="input-base appearance-none cursor-pointer">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={set('status')} className="input-base appearance-none cursor-pointer">
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
