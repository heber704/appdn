'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, X, ChevronUp, ChevronDown, TestTube2, Pencil, Trash2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ModalNovoCaso from '@/components/casos-teste/modal-novo-caso'

interface CasoTeste {
  id: number
  titulo: string
  descricao: string | null
  prioridade: string
  status: string
  tipo: string
  projeto: { id: number; nome: string } | null
  _count: { passos: number; execucoes: number }
  criadoEm: string
}

const statusColor: Record<string, string> = {
  'Pendente':  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Aprovado':  'bg-green-500/20  text-green-400  border border-green-500/30',
  'Reprovado': 'bg-red-500/20    text-red-400    border border-red-500/30',
  'Bloqueado': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
}

const prioridadeColor: Record<string, string> = {
  'Alta':  'text-red-400',
  'Média': 'text-yellow-400',
  'Baixa': 'text-green-400',
}

export default function CasosTestePage() {
  const [casos, setCasos] = useState<CasoTeste[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('TODOS')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordenar, setOrdenar] = useState<{ campo: string; dir: 'asc' | 'desc' }>({ campo: 'criadoEm', dir: 'desc' })
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<CasoTeste | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('q', busca)
      if (filtroPrioridade !== 'TODOS') params.set('prioridade', filtroPrioridade)
      const res = await fetch(`/api/casos-teste?${params}`)
      const data = await res.json()
      let lista: CasoTeste[] = Array.isArray(data) ? data : (data.casos || [])
      if (filtroStatus !== 'TODOS') lista = lista.filter(c => c.status === filtroStatus)
      // Ordenar localmente
      lista.sort((a, b) => {
        const va = (a as any)[ordenar.campo] || ''
        const vb = (b as any)[ordenar.campo] || ''
        return ordenar.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
      })
      setCasos(lista)
    } catch { toast.error('Erro ao carregar casos de teste') }
    finally { setLoading(false) }
  }, [busca, filtroPrioridade, filtroStatus, ordenar])

  useEffect(() => { carregar() }, [carregar])

  const excluir = async (id: number) => {
    if (!confirm('Excluir este caso de teste?')) return
    try {
      await fetch(`/api/casos-teste/${id}`, { method: 'DELETE' })
      toast.success('Caso excluído')
      carregar()
    } catch { toast.error('Erro ao excluir') }
  }

  const toggleOrdem = (campo: string) => {
    setOrdenar(o => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' })
  }

  const Th = ({ campo, label }: { campo: string; label: string }) => (
    <th onClick={() => toggleOrdem(campo)}
      className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white select-none">
      <div className="flex items-center gap-1">
        {label}
        {ordenar.campo === campo ? (ordenar.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <div className="w-3" />}
      </div>
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Casos de Teste</h1>
          <p className="text-zinc-400 text-sm mt-1">{casos.length} caso(s)</p>
        </div>
        <button onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Caso
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar casos de teste..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          {['TODOS', 'Pendente', 'Aprovado', 'Reprovado', 'Bloqueado'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          {['TODOS', 'Alta', 'Média', 'Baixa'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
        ) : casos.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <TestTube2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum caso de teste encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <Th campo="titulo" label="Título" />
                  <Th campo="prioridade" label="Prioridade" />
                  <Th campo="status" label="Status" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Projeto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Passos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Execuções</th>
                  <Th campo="criadoEm" label="Criado em" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {casos.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{c.titulo}</p>
                      {c.descricao && <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{c.descricao}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${prioridadeColor[c.prioridade] || 'text-zinc-400'}`}>{c.prioridade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status] || 'bg-zinc-700 text-zinc-400 border border-zinc-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{c.projeto?.nome || '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400 text-center">{c._count?.passos ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400 text-center">{c._count?.execucoes ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditando(c); setModalAberto(true) }}
                          className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => excluir(c.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalNovoCaso
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar() }}
          editando={editando}
        />
      )}
    </div>
  )
}
