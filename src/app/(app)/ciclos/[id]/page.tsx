'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RotateCcw, Plus, Trash2, Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, Calendar, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CicloItem {
  id: number
  casoTeste: { id: number; titulo: string; prioridade: string; status: string }
}

interface Ciclo {
  id: number
  nome: string
  status: string
  dataInicio: string
  dataFim: string
  projeto: { id: number; nome: string } | null
  itens: CicloItem[]
  _count: { itens: number; execucoes: number }
}

interface CasoDisponivel {
  id: number
  titulo: string
  prioridade: string
  status: string
}

const statusColor: Record<string, string> = {
  'Planejado': 'bg-blue-500/20 text-blue-400',
  'Em Execução': 'bg-yellow-500/20 text-yellow-400',
  'Concluído': 'bg-green-500/20 text-green-400',
  'Cancelado': 'bg-red-500/20 text-red-400',
}

export default function CicloDetalhe() {
  const { id } = useParams()
  const router = useRouter()
  const [ciclo, setCiclo] = useState<Ciclo | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalAdicionar, setModalAdicionar] = useState(false)
  const [casosDisponiveis, setCasosDisponiveis] = useState<CasoDisponivel[]>([])
  const [buscaCasos, setBuscaCasos] = useState('')
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [adicionando, setAdicionando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ciclos/${id}`)
      const data = await res.json()
      setCiclo(data)
    } catch { toast.error('Erro ao carregar ciclo') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const abrirAdicionar = async () => {
    const res = await fetch('/api/casos-teste')
    const data = await res.json()
    const todos: CasoDisponivel[] = Array.isArray(data) ? data : (data.casos || [])
    const idsJaAdicionados = ciclo?.itens.map(i => i.casoTeste.id) || []
    setCasosDisponiveis(todos.filter(c => !idsJaAdicionados.includes(c.id)))
    setSelecionados([])
    setModalAdicionar(true)
  }

  const adicionarCasos = async () => {
    if (!selecionados.length) return
    setAdicionando(true)
    try {
      await fetch(`/api/ciclos/${id}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoTesteIds: selecionados }),
      })
      toast.success(`${selecionados.length} caso(s) adicionado(s)!`)
      setModalAdicionar(false)
      carregar()
    } catch { toast.error('Erro ao adicionar') }
    finally { setAdicionando(false) }
  }

  const removerCaso = async (casoTesteId: number) => {
    if (!confirm('Remover este caso do ciclo?')) return
    try {
      await fetch(`/api/ciclos/${id}/itens`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoTesteId }),
      })
      toast.success('Caso removido')
      carregar()
    } catch { toast.error('Erro ao remover') }
  }

  const alterarStatus = async (status: string) => {
    await fetch(`/api/ciclos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    toast.success('Status atualizado')
    carregar()
  }

  const casosFiltrados = casosDisponiveis.filter(c =>
    c.titulo.toLowerCase().includes(buscaCasos.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
  if (!ciclo) return <div className="text-center py-32 text-zinc-500">Ciclo não encontrado</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{ciclo.nome}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[ciclo.status] || 'bg-zinc-700 text-zinc-400'}`}>{ciclo.status}</span>
            </div>
            {ciclo.projeto && <p className="text-zinc-400 text-sm">{ciclo.projeto.nome}</p>}
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
              <Calendar size={12} />
              {new Date(ciclo.dataInicio).toLocaleDateString('pt-BR')} → {new Date(ciclo.dataFim).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {ciclo.status === 'Planejado' && (
            <button onClick={() => alterarStatus('Em Execução')}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              Iniciar Execução
            </button>
          )}
          {ciclo.status === 'Em Execução' && (
            <button onClick={() => alterarStatus('Concluído')}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              Concluir
            </button>
          )}
          <button onClick={abrirAdicionar}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> Adicionar Casos
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total de casos', valor: ciclo._count.itens, cor: 'text-white' },
          { label: 'Execuções', valor: ciclo._count.execucoes, cor: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cor}`}>{s.valor}</p>
          </div>
        ))}
      </div>

      {/* Casos do ciclo */}
      <div>
        <h2 className="text-white font-semibold mb-3">Casos de Teste ({ciclo.itens.length})</h2>
        {ciclo.itens.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 bg-zinc-900 border border-dashed border-zinc-800 rounded-xl">
            <RotateCcw size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum caso adicionado ainda</p>
            <button onClick={abrirAdicionar} className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Adicionar casos de teste →
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">Título</th>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">Prioridade</th>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ciclo.itens.map(item => (
                  <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-white">{item.casoTeste.titulo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${item.casoTeste.prioridade === 'Alta' ? 'text-red-400' : item.casoTeste.prioridade === 'Média' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {item.casoTeste.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">{item.casoTeste.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removerCaso(item.casoTeste.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal adicionar casos */}
      {modalAdicionar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Adicionar Casos ao Ciclo</h2>
              <button onClick={() => setModalAdicionar(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={buscaCasos} onChange={e => setBuscaCasos(e.target.value)} placeholder="Buscar casos..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white pl-8 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <p className="text-zinc-500 text-xs mt-2">{selecionados.length} selecionado(s)</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {casosFiltrados.length === 0 ? (
                <p className="text-center text-zinc-500 py-8 text-sm">Nenhum caso disponível</p>
              ) : casosFiltrados.map(c => (
                <button key={c.id} onClick={() => setSelecionados(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selecionados.includes(c.id) ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-zinc-800'}`}>
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selecionados.includes(c.id) ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'}`}>
                    {selecionados.includes(c.id) && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{c.titulo}</p>
                    <p className="text-zinc-500 text-xs">{c.prioridade}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button onClick={() => setModalAdicionar(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={adicionarCasos} disabled={adicionando || !selecionados.length}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {adicionando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Adicionar {selecionados.length > 0 ? `(${selecionados.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
