'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, X, RotateCcw, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Ciclo {
  id: number
  nome: string
  status: string
  dataInicio: string
  dataFim: string
  projeto: { id: number; nome: string } | null
  _count?: { itens: number }
}

interface Projeto { id: number; nome: string }

const statusColor: Record<string, string> = {
  'Planejado': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Em Execução': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Concluído': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'Cancelado': 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function CiclosPage() {
  const [ciclos, setCiclos] = useState<Ciclo[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', projetoId: '', dataInicio: '', dataFim: '', status: 'Planejado' })
  const router = useRouter()
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'TODOS') params.set('status', filtroStatus)
      const res = await fetch(`/api/ciclos?${params}`)
      const data = await res.json()
      const lista: Ciclo[] = Array.isArray(data) ? data : (data.ciclos || [])
      setCiclos(busca ? lista.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())) : lista)
    } catch { toast.error('Erro ao carregar ciclos') }
    finally { setLoading(false) }
  }, [busca, filtroStatus])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(d.projetos || []))
  }, [])

  const criar = async () => {
    setErro('')
    if (!form.nome.trim()) { setErro('Nome obrigatório'); return }
    if (!form.projetoId) { setErro('Projeto obrigatório'); return }
    if (!form.dataInicio || !form.dataFim) { setErro('Datas obrigatórias'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/ciclos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projetoId: Number(form.projetoId) }),
      })
      if (!res.ok) { const d = await res.json(); setErro(d.error || 'Erro ao criar'); return }
      toast.success('Ciclo criado!')
      setModalAberto(false)
      setForm({ nome: '', projetoId: '', dataInicio: '', dataFim: '', status: 'Planejado' })
      carregar()
    } catch { setErro('Erro de conexão') }
    finally { setSalvando(false) }
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ciclos de Teste</h1>
          <p className="text-zinc-400 text-sm mt-1">{ciclos.length} ciclo(s)</p>
        </div>
        <button onClick={() => { setModalAberto(true); setErro('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Ciclo
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ciclos..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          {['TODOS', 'Planejado', 'Em Execução', 'Concluído', 'Cancelado'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : ciclos.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <RotateCcw size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum ciclo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ciclos.map(c => (
            <div key={c.id} onClick={() => router.push(`/ciclos/${c.id}`)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors space-y-3 cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm leading-tight">{c.nome}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusColor[c.status] || 'bg-zinc-700 text-zinc-400 border border-zinc-600'}`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><CheckCircle size={12} />{c._count?.itens ?? 0} casos</span>
                {c.projeto && <span className="truncate">{c.projeto.nome}</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Calendar size={12} />{fmt(c.dataInicio)} → {fmt(c.dataFim)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Novo Ciclo de Teste</h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Projeto *</label>
                <select value={form.projetoId} onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Selecione...</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Data início *</label>
                  <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Data fim *</label>
                  <input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Status inicial</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  {['Planejado', 'Em Execução'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setModalAberto(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={criar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
