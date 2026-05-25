'use client'
// src/app/(app)/projetos/[id]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FolderKanban, Bug, TestTube2, RotateCcw, BookOpen,
  Edit2, Trash2, Check, X, Loader2, ArrowLeft, Calendar,
  Users, AlertCircle, Save
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['Em andamento', 'Planejado', 'Pausado', 'Concluído', 'Cancelado']
const STATUS_BADGE: Record<string, string> = {
  'Em andamento': 'badge-success',
  'Planejado':    'badge-info',
  'Pausado':      'badge-warning',
  'Concluído':    'badge-muted',
  'Cancelado':    'badge-danger',
}

export default function ProjetoDetalhePage() {
  const { id } = useParams()
  const router = useRouter()

  const [projeto, setProjeto] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch(`/api/projetos/${id}`)
      .then(r => r.json())
      .then(data => {
        setProjeto(data)
        setForm({
          nome: data.nome,
          descricao: data.descricao || '',
          status: data.status,
          dataInicio: data.dataInicio?.split('T')[0] || '',
          dataPrevisao: data.dataPrevisao?.split('T')[0] || '',
        })
      })
      .catch(() => toast.error('Erro ao carregar projeto'))
      .finally(() => setLoading(false))
  }, [id])

  const salvar = async () => {
    setSalvando(true)
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setProjeto((p: any) => ({ ...p, ...data }))
      setEditando(false)
      toast.success('Projeto atualizado!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSalvando(false) }
  }

  const excluir = async () => {
    try {
      const res = await fetch(`/api/projetos/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Sem permissão para excluir'); return }
      toast.success('Projeto excluído')
      router.push('/projetos')
    } catch { toast.error('Erro ao excluir') }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  )

  if (!projeto) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <AlertCircle className="w-8 h-8 text-status-danger" />
      <p className="text-text-secondary">Projeto não encontrado</p>
      <button onClick={() => router.push('/projetos')} className="btn-secondary">Voltar</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <button onClick={() => router.push('/projetos')}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Projetos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-accent" />
          </div>
          {editando ? (
            <input value={form.nome} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))}
              className="input-base text-xl font-display font-bold w-80" autoFocus />
          ) : (
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">{projeto.nome}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={STATUS_BADGE[projeto.status] || 'badge-muted'}>{projeto.status}</span>
                <span className="text-text-muted text-xs">ID #{projeto.id}</span>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {editando ? (
            <>
              <button onClick={() => setEditando(false)} className="btn-secondary flex items-center gap-1.5">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex items-center gap-1.5">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/25 rounded-lg px-3 py-2">
                  <span className="text-sm text-status-danger">Confirmar exclusão?</span>
                  <button onClick={excluir} className="text-xs bg-status-danger text-white px-2 py-1 rounded font-medium">Sim</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-secondary hover:text-text-primary">Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="btn-danger flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-3 gap-4">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-4">
          {/* Descrição */}
          <div className="card">
            <h3 className="font-display font-semibold text-sm text-text-secondary mb-3 uppercase tracking-wide">Descrição</h3>
            {editando ? (
              <textarea value={form.descricao}
                onChange={e => setForm((f: any) => ({ ...f, descricao: e.target.value }))}
                rows={4} placeholder="Descreva o projeto..." className="input-base resize-none" />
            ) : (
              <p className="text-text-secondary text-sm leading-relaxed">
                {projeto.descricao || <span className="text-text-muted italic">Sem descrição</span>}
              </p>
            )}
          </div>

          {/* Contadores de itens */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Bugs', count: projeto._count?.bugs || 0, icon: Bug, href: `/bugs?projeto=${id}`, color: 'text-status-danger' },
              { label: 'Casos', count: projeto._count?.casosTeste || 0, icon: TestTube2, href: `/casos-teste?projeto=${id}`, color: 'text-accent' },
              { label: 'Ciclos', count: projeto._count?.ciclos || 0, icon: RotateCcw, href: `/ciclos?projeto=${id}`, color: 'text-status-info' },
              { label: 'Requisitos', count: projeto._count?.requisitos || 0, icon: BookOpen, href: `/requisitos?projeto=${id}`, color: 'text-status-warning' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="card flex flex-col items-center gap-1.5 hover:border-border-strong transition-all text-center">
                <item.icon className={cn('w-5 h-5', item.color)} />
                <span className="font-display font-bold text-xl text-text-primary">{item.count}</span>
                <span className="text-text-muted text-xs">{item.label}</span>
              </a>
            ))}
          </div>

          {/* Membros */}
          {projeto.membros?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-sm text-text-secondary mb-3 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" /> Membros
              </h3>
              <div className="space-y-2">
                {projeto.membros.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">{m.usuario.nome[0]}</span>
                      </div>
                      <span className="text-sm text-text-primary">{m.usuario.nome}</span>
                    </div>
                    <span className="badge-muted">{m.papel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar de info */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-wide">Informações</h3>

            <InfoField label="Status" editing={editando}>
              {editando ? (
                <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="input-base appearance-none cursor-pointer">
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span className={STATUS_BADGE[projeto.status] || 'badge-muted'}>{projeto.status}</span>
              )}
            </InfoField>

            <InfoField label="Data de início">
              {editando ? (
                <input type="date" value={form.dataInicio}
                  onChange={e => setForm((f: any) => ({ ...f, dataInicio: e.target.value }))}
                  className="input-base" />
              ) : (
                <span className="text-text-primary text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  {formatDate(projeto.dataInicio)}
                </span>
              )}
            </InfoField>

            <InfoField label="Previsão de entrega">
              {editando ? (
                <input type="date" value={form.dataPrevisao}
                  onChange={e => setForm((f: any) => ({ ...f, dataPrevisao: e.target.value }))}
                  className="input-base" />
              ) : projeto.dataPrevisao ? (
                <span className="text-text-primary text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  {formatDate(projeto.dataPrevisao)}
                </span>
              ) : (
                <span className="text-text-muted text-sm italic">Não definida</span>
              )}
            </InfoField>

            <InfoField label="Criado em">
              <span className="text-text-secondary text-sm">{formatDate(projeto.criadoEm)}</span>
            </InfoField>
          </div>

          {/* Links rápidos */}
          <div className="card space-y-2">
            <h3 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-wide mb-3">Acessar</h3>
            {[
              { label: 'Bugs do projeto', href: `/bugs?projeto=${id}`, icon: Bug },
              { label: 'Casos de teste', href: `/casos-teste?projeto=${id}`, icon: TestTube2 },
              { label: 'Ciclos de teste', href: `/ciclos?projeto=${id}`, icon: RotateCcw },
              { label: 'Requisitos', href: `/requisitos?projeto=${id}`, icon: BookOpen },
            ].map(link => (
              <a key={link.label} href={link.href}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors py-1">
                <link.icon className="w-4 h-4" /> {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, children, editing }: { label: string; children: React.ReactNode; editing?: boolean }) {
  return (
    <div>
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      {children}
    </div>
  )
}
