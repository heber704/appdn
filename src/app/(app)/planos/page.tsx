'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, X, ClipboardList, Calendar, CheckCircle, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface PlanoTeste {
  id: number
  titulo: string
  descricao: string | null
  objetivo: string | null
  escopo: string | null
  criteriosEntrada: string | null
  criteriosSaida: string | null
  estrategia: string | null
  status: string
  versao: string | null
  projeto: { id: number; nome: string } | null
  criadoEm: string
}

interface Projeto { id: number; nome: string }

const statusColor: Record<string, string> = {
  'Rascunho': 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
  'Em Revisão': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Aprovado': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'Obsoleto': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'RASCUNHO': 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
  'EM_REVISAO': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'APROVADO': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'OBSOLETO': 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function PlanosPage() {
  const { data: session } = useSession()
  const [planos, setPlanos] = useState<PlanoTeste[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [modalAberto, setModalAberto] = useState(false)
  const [detalhes, setDetalhes] = useState<PlanoTeste | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', objetivo: '', escopo: '', estrategia: '', criteriosEntrada: '', criteriosSaida: '', versao: '1.0', projetoId: '' })

  const podeAprovar = ['Administrador', 'Gerente de Projeto'].includes(session?.user?.cargo || '')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ busca, status: filtroStatus })
      const res = await fetch(`/api/planos?${params}`)
      const data = await res.json()
      setPlanos(data.planos || [])
    } catch { toast.error('Erro ao carregar planos') }
    finally { setLoading(false) }
  }, [busca, filtroStatus])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(d.projetos || []))
  }, [])

  const criar = async () => {
    if (!form.titulo.trim() || !form.projetoId) { toast.error('Título e projeto obrigatórios'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projeto_id: Number(form.projetoId) }),
      })
      if (!res.ok) throw new Error()
      toast.success('Plano criado!')
      setModalAberto(false)
      setForm({ titulo: '', descricao: '', objetivo: '', escopo: '', estrategia: '', criteriosEntrada: '', criteriosSaida: '', versao: '1.0', projetoId: '' })
      carregar()
    } catch { toast.error('Erro ao criar plano') }
    finally { setSalvando(false) }
  }

  const alterarStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/planos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const label = { 'EM_REVISAO': 'enviado para revisão', 'APROVADO': 'aprovado', 'OBSOLETO': 'marcado como obsoleto' }
      toast.success(`Plano ${label[status as keyof typeof label] || 'atualizado'}!`)
      setDetalhes(null)
      carregar()
    } catch { toast.error('Erro ao atualizar status') }
  }

  const displayStatus = (s: string) => s.replace('_', ' ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardList size={22} /> Planos de Teste</h1>
          <p className="text-zinc-400 text-sm mt-1">{planos.length} plano(s)</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar planos..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          {['TODOS', 'RASCUNHO', 'EM_REVISAO', 'APROVADO', 'OBSOLETO'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : planos.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum plano encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {planos.map(p => (
            <div key={p.id} onClick={() => setDetalhes(p)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors cursor-pointer space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm leading-tight">{p.titulo}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${statusColor[p.status] || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>{displayStatus(p.status)}</span>
              </div>
              {p.descricao && <p className="text-zinc-400 text-xs line-clamp-2">{p.descricao}</p>}
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {p.versao && <span>v{p.versao}</span>}
                {p.projeto && <span>{p.projeto.nome}</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-600">
                <Calendar size={11} />{new Date(p.criadoEm).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <h2 className="text-white font-bold text-lg">Novo Plano de Teste</h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Título *</label>
                  <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
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
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Versão</label>
                  <input value={form.versao} onChange={e => setForm(f => ({ ...f, versao: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              {[
                { key: 'descricao', label: 'Descrição', rows: 2 },
                { key: 'objetivo', label: 'Objetivo', rows: 2 },
                { key: 'escopo', label: 'Escopo', rows: 2 },
                { key: 'estrategia', label: 'Estratégia de Teste', rows: 2 },
                { key: 'criteriosEntrada', label: 'Critérios de Entrada', rows: 2 },
                { key: 'criteriosSaida', label: 'Critérios de Saída', rows: 2 },
              ].map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">{label}</label>
                  <textarea value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={rows}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 pt-0 sticky bottom-0 bg-zinc-900 border-t border-zinc-800">
              <button onClick={() => setModalAberto(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={criar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhes + aprovação */}
      {detalhes && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <div>
                <h2 className="text-white font-bold text-lg">{detalhes.titulo}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${statusColor[detalhes.status] || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>{displayStatus(detalhes.status)}</span>
              </div>
              <button onClick={() => setDetalhes(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {detalhes.projeto && <p className="text-zinc-500">Projeto: <span className="text-zinc-300">{detalhes.projeto.nome}</span></p>}
              {detalhes.versao && <p className="text-zinc-500">Versão: <span className="text-zinc-300">v{detalhes.versao}</span></p>}
              {[
                ['Objetivo', detalhes.objetivo],
                ['Escopo', detalhes.escopo],
                ['Estratégia', detalhes.estrategia],
                ['Critérios de Entrada', detalhes.criteriosEntrada],
                ['Critérios de Saída', detalhes.criteriosSaida],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-zinc-500 text-xs font-semibold uppercase">{label}</p>
                  <p className="text-zinc-300 text-sm mt-1 whitespace-pre-wrap">{val}</p>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex flex-wrap gap-2 border-t border-zinc-800">
              {detalhes.status !== 'EM_REVISAO' && detalhes.status !== 'APROVADO' && (
                <button onClick={() => alterarStatus(detalhes.id, 'EM_REVISAO')}
                  className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  <Send size={12} /> Enviar para Revisão
                </button>
              )}
              {podeAprovar && detalhes.status !== 'APROVADO' && (
                <button onClick={() => alterarStatus(detalhes.id, 'APROVADO')}
                  className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  <CheckCircle size={12} /> Aprovar
                </button>
              )}
              {podeAprovar && detalhes.status !== 'OBSOLETO' && (
                <button onClick={() => alterarStatus(detalhes.id, 'OBSOLETO')}
                  className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Marcar Obsoleto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
