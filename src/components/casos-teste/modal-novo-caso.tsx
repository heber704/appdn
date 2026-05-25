'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPOS = ['Funcional', 'Não funcional', 'Regressão', 'Smoke', 'Integração']
const PRIORIDADES = ['Alta', 'Média', 'Baixa']

interface Passo { id?: number; descricao: string; resultadoEsperado: string }
interface Projeto { id: number; nome: string }

interface Props {
  onClose: () => void
  onSalvo: () => void
  editando?: any | null
}

export default function ModalNovoCaso({ onClose, onSalvo, editando }: Props) {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [form, setForm] = useState({
    titulo: editando?.titulo || '',
    descricao: editando?.descricao || '',
    preCondicoes: editando?.preCondicoes || '',
    posCondicoes: editando?.posCondicoes || '',
    tipo: editando?.tipo || 'Funcional',
    prioridade: editando?.prioridade || 'Média',
    projetoId: editando?.projeto?.id?.toString() || '',
  })
  const [passos, setPassos] = useState<Passo[]>([{ descricao: '', resultadoEsperado: '' }])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<'info' | 'passos'>('info')

  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => setProjetos(d.projetos || []))
    if (editando?.id) {
      fetch(`/api/casos-teste/${editando.id}`).then(r => r.json()).then(d => {
        if (d.caso?.passos?.length > 0) {
          setPassos(d.caso.passos.map((p: any) => ({ id: p.id, descricao: p.descricao, resultadoEsperado: p.resultadoEsperado })))
        }
      })
    }
  }, [editando])

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const adicionarPasso = () => setPassos(p => [...p, { descricao: '', resultadoEsperado: '' }])
  const removerPasso = (i: number) => setPassos(p => p.filter((_, idx) => idx !== i))
  const setPassoField = (i: number, k: keyof Passo) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setPassos(p => p.map((passo, idx) => idx === i ? { ...passo, [k]: e.target.value } : passo))

  const salvar = async () => {
    setErro('')
    if (!form.titulo.trim()) { setErro('Título obrigatório'); setAba('info'); return }
    if (!form.projetoId) { setErro('Projeto obrigatório'); setAba('info'); return }
    const passosValidos = passos.filter(p => p.descricao.trim())
    setLoading(true)
    try {
      const url = editando?.id ? `/api/casos-teste/${editando.id}` : '/api/casos-teste'
      const method = editando?.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projetoId: Number(form.projetoId), passos: passosValidos }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar'); return }
      toast.success(editando ? 'Caso atualizado!' : 'Caso criado!')
      onSalvo()
    } catch { setErro('Erro de conexão') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">{editando ? 'Editar Caso de Teste' : 'Novo Caso de Teste'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6">
          {(['info', 'passos'] as const).map(tab => (
            <button key={tab} onClick={() => setAba(tab)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${aba === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}>
              {tab === 'info' ? 'Informações' : `Passos (${passos.filter(p => p.descricao.trim()).length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

          {aba === 'info' ? (
            <>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Título *</label>
                <input value={form.titulo} onChange={setF('titulo')}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={setF('descricao')} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Projeto *</label>
                  <select value={form.projetoId} onChange={setF('projetoId')}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Selecione...</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Tipo</label>
                  <select value={form.tipo} onChange={setF('tipo')}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Prioridade</label>
                  <select value={form.prioridade} onChange={setF('prioridade')}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Pré-condições</label>
                  <textarea value={form.preCondicoes} onChange={setF('preCondicoes')} rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Pós-condições</label>
                  <textarea value={form.posCondicoes} onChange={setF('posCondicoes')} rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {passos.map((passo, i) => (
                <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-xs font-mono bg-blue-500/10 px-2 py-0.5 rounded">Passo {i + 1}</span>
                    {passos.length > 1 && (
                      <button onClick={() => removerPasso(i)} className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Ação</label>
                    <textarea value={passo.descricao} onChange={setPassoField(i, 'descricao')} rows={2}
                      placeholder="O que o usuário deve fazer..."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Resultado esperado</label>
                    <textarea value={passo.resultadoEsperado} onChange={setPassoField(i, 'resultadoEsperado')} rows={2}
                      placeholder="O que deve acontecer..."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                </div>
              ))}
              <button onClick={adicionarPasso}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                <Plus size={14} /> Adicionar passo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {editando ? 'Salvar alterações' : 'Criar caso'}
          </button>
        </div>
      </div>
    </div>
  )
}
