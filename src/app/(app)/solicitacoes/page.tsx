'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, X, MessageSquare, Clock, CheckCircle, XCircle, Bug, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface Solicitacao {
  id: number
  titulo: string
  descricao: string
  passos: string | null
  severidade: string
  status: string
  solicitante: { nome: string }
  projeto: { id: number; nome: string } | null
  criadoEm: string
}

interface Projeto { id: number; nome: string }

const statusConfig: Record<string, { cor: string }> = {
  'Aguardando análise': { cor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  'Em análise': { cor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  'Aprovada': { cor: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  'Rejeitada': { cor: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  'Convertida em Bug': { cor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
}

export default function SolicitacoesPage() {
  const { data: session } = useSession()
  const [itens, setItens] = useState<Solicitacao[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [modalAberto, setModalAberto] = useState(false)
  const [detalhes, setDetalhes] = useState<Solicitacao | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [convertendo, setConvertendo] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', passos: '', severidade: 'Médio', projetoId: '' })

  const isAdmin = session?.user?.cargo === 'Administrador' || session?.user?.cargo === 'Gerente de Projeto'

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'TODOS') params.set('status', filtroStatus)
      const res = await fetch(`/api/solicitacoes?${params}`)
      const data = await res.json()
      const lista: Solicitacao[] = Array.isArray(data) ? data : (data.solicitacoes || [])
      setItens(busca ? lista.filter(s => s.titulo.toLowerCase().includes(busca.toLowerCase())) : lista)
    } catch { toast.error('Erro ao carregar solicitações') }
    finally { setLoading(false) }
  }, [busca, filtroStatus])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(d.projetos || []))
  }, [])

  const criar = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) { toast.error('Título e descrição obrigatórios'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projetoId: form.projetoId ? Number(form.projetoId) : null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Solicitação enviada!')
      setModalAberto(false)
      setForm({ titulo: '', descricao: '', passos: '', severidade: 'Médio', projetoId: '' })
      carregar()
    } catch { toast.error('Erro ao enviar') }
    finally { setSalvando(false) }
  }

  const alterarStatus = async (id: number, status: string) => {
    await fetch(`/api/solicitacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    toast.success('Status atualizado')
    setDetalhes(null)
    carregar()
  }

  const converterBug = async (id: number) => {
    setConvertendo(true)
    try {
      const res = await fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'converter_bug' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Convertida em Bug #${data.bugId}!`)
      setDetalhes(null)
      carregar()
    } catch (e: any) { toast.error(e.message || 'Erro ao converter') }
    finally { setConvertendo(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitações</h1>
          <p className="text-zinc-400 text-sm mt-1">{itens.length} solicitação(ões)</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nova Solicitação
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar solicitações..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          <option value="TODOS">Todos</option>
          {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : itens.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(s => {
            const cfg = statusConfig[s.status]
            return (
              <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors cursor-pointer"
                onClick={() => setDetalhes(s)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-500 text-xs font-mono">#{s.id}</span>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{s.severidade}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm">{s.titulo}</h3>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{s.descricao}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span>{s.solicitante?.nome}</span>
                      {s.projeto && <span>· {s.projeto.nome}</span>}
                      <span>· {new Date(s.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg?.cor || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>{s.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nova solicitação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Nova Solicitação</h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Descrição *</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Passos para reproduzir</label>
                <textarea value={form.passos} onChange={e => setForm(f => ({ ...f, passos: e.target.value }))} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Severidade</label>
                  <select value={form.severidade} onChange={e => setForm(f => ({ ...f, severidade: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    {['Baixo', 'Médio', 'Alto', 'Crítico'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Projeto</label>
                  <select value={form.projetoId} onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Nenhum</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setModalAberto(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={criar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhes/ações */}
      {detalhes && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg">Solicitação #{detalhes.id}</h2>
              <button onClick={() => setDetalhes(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-white font-semibold">{detalhes.titulo}</h3>
              <p className="text-zinc-400 text-sm">{detalhes.descricao}</p>
              {detalhes.passos && (
                <div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase mb-1">Passos</p>
                  <p className="text-zinc-400 text-sm whitespace-pre-wrap">{detalhes.passos}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-zinc-500">Por: <span className="text-zinc-300">{detalhes.solicitante?.nome}</span></span>
                <span className="text-zinc-500">Severidade: <span className="text-zinc-300">{detalhes.severidade}</span></span>
                {detalhes.projeto && <span className="text-zinc-500">Projeto: <span className="text-zinc-300">{detalhes.projeto.nome}</span></span>}
              </div>
            </div>
            {isAdmin && detalhes.status !== 'Convertida em Bug' && (
              <div className="p-6 pt-0 space-y-2">
                <p className="text-zinc-500 text-xs font-semibold uppercase mb-2">Ações</p>
                <div className="flex flex-wrap gap-2">
                  {['Em análise', 'Aprovada', 'Rejeitada'].map(s => (
                    <button key={s} onClick={() => alterarStatus(detalhes.id, s)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      Marcar como {s}
                    </button>
                  ))}
                  {detalhes.projeto && (
                    <button onClick={() => converterBug(detalhes.id)} disabled={convertendo}
                      className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {convertendo ? <Loader2 size={12} className="animate-spin" /> : <Bug size={12} />}
                      Converter em Bug
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
