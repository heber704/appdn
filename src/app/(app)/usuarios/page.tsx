'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, Loader2, X, Shield, Ban, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Usuario {
  id: number
  nome: string
  email: string
  login: string
  cargo: string
  situacao: string
  bloqueioTipo: string | null
  criadoEm: string
}

const CARGOS = ['Administrador', 'Gerente de Projeto', 'Analista de QA', 'Desenvolvedor', 'Aguardando Atribuição']

const cargoBadge: Record<string, string> = {
  'Administrador': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'Gerente de Projeto': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'Analista de QA': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Desenvolvedor': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'Aguardando Atribuição': 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('TODOS')
  const [filtroSituacao, setFiltroSituacao] = useState('TODOS')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', login: '', senha: '', cargo: 'Analista de QA' })
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('q', busca)
      if (filtroCargo !== 'TODOS') params.set('cargo', filtroCargo)
      if (filtroSituacao !== 'TODOS') params.set('situacao', filtroSituacao)
      const res = await fetch(`/api/admin/usuarios?${params}`)
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch { toast.error('Erro ao carregar usuários') }
    finally { setLoading(false) }
  }, [busca, filtroCargo, filtroSituacao])

  useEffect(() => { carregar() }, [carregar])

  const criar = async () => {
    setErro('')
    if (!form.nome.trim() || !form.email.trim() || !form.login.trim() || !form.senha || !form.cargo) {
      setErro('Preencha todos os campos'); return
    }
    if (form.senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar'); return }
      toast.success('Usuário criado!')
      setModalAberto(false)
      setForm({ nome: '', email: '', login: '', senha: '', cargo: 'Analista de QA' })
      carregar()
    } catch { setErro('Erro de conexão') }
    finally { setSalvando(false) }
  }

  const alterarSituacao = async (id: number, situacao: string) => {
    try {
      await fetch(`/api/admin/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao }),
      })
      toast.success(`Usuário ${situacao === 'Ativo' ? 'ativado' : 'bloqueado'}`)
      carregar()
    } catch { toast.error('Erro ao alterar situação') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={22} /> Gestão de Usuários</h1>
          <p className="text-zinc-400 text-sm mt-1">{usuarios.length} usuário(s) encontrado(s)</p>
        </div>
        <button onClick={() => { setModalAberto(true); setErro('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, login ou e-mail..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          <option value="TODOS">Todos os cargos</option>
          {CARGOS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          <option value="TODOS">Todas as situações</option>
          <option value="Ativo">Ativo</option>
          <option value="Bloqueado">Bloqueado</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 font-medium px-4 py-3">Usuário</th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">Login</th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">Cargo</th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">Situação</th>
                <th className="text-left text-zinc-400 font-medium px-4 py-3">Criado em</th>
                <th className="text-right text-zinc-400 font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.nome}</p>
                        <p className="text-zinc-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{u.login}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cargoBadge[u.cargo] || 'bg-zinc-700 text-zinc-300'}`}>{u.cargo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 w-fit text-xs px-2 py-0.5 rounded-full ${u.situacao === 'Ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {u.situacao === 'Ativo' ? <CheckCircle size={11} /> : <Ban size={11} />}
                      {u.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(u.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.situacao === 'Ativo' ? (
                        <button onClick={() => alterarSituacao(u.id, 'Bloqueado')}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Bloquear">
                          <Ban size={14} />
                        </button>
                      ) : (
                        <button onClick={() => alterarSituacao(u.id, 'Ativo')}
                          className="p-1.5 text-zinc-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors" title="Ativar">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Shield size={18} /> Novo Usuário</h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Nome completo *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-zinc-400 text-xs font-medium block mb-1">E-mail *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Login *</label>
                  <input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Senha *</label>
                  <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-zinc-400 text-xs font-medium block mb-1">Cargo *</label>
                  <select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                    {CARGOS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setModalAberto(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={criar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
