// src/app/(app)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateTime, saudacao, isDiaDescanso, isFeriado } from '@/lib/utils'
import {
  Bug, TestTube2, CheckCircle2, XCircle, AlertTriangle,
  FolderKanban, Bell, TrendingUp, Clock, Activity
} from 'lucide-react'

export const metadata = { title: 'Dashboard — App Development Notifier' }
export const dynamic = 'force-dynamic'

async function getStats(userId: number) {
  const [
    bugsAbertos, bugsAndamento, bugsResolvidos, bugsCriticos,
    casosTotal, casosExecutados, casosAprovados, casosReprovados,
    projetos, solicitacoesPendentes,
    ultimosBugs, ultimasExecucoes,
  ] = await Promise.all([
    prisma.bug.count({ where: { status: 'Aberto' } }),
    prisma.bug.count({ where: { status: { in: ['Em análise', 'Em correção'] } } }),
    prisma.bug.count({ where: { status: { in: ['Resolvido', 'Fechado'] } } }),
    prisma.bug.count({ where: { severidade: 'Crítico', status: { notIn: ['Resolvido', 'Fechado'] } } }),
    prisma.casoTeste.count(),
    prisma.execucaoTeste.count({ where: { resultado: { not: 'Não executado' } } }),
    prisma.execucaoTeste.count({ where: { resultado: 'Aprovado' } }),
    prisma.execucaoTeste.count({ where: { resultado: 'Reprovado' } }),
    prisma.projeto.findMany({
      where: { status: 'Em andamento' },
      select: { id: true, nome: true },
      take: 4,
    }),
    prisma.solicitacao.count({ where: { status: 'Aguardando análise' } }),
    prisma.bug.findMany({
      take: 6, orderBy: { criadoEm: 'desc' },
      select: {
        id: true, titulo: true, severidade: true, status: true, criadoEm: true,
        projeto: { select: { nome: true } },
      },
    }),
    prisma.execucaoTeste.findMany({
      take: 5, orderBy: { iniciadoEm: 'desc' },
      select: {
        id: true, resultado: true, iniciadoEm: true,
        casoTeste: { select: { titulo: true } },
        executor: { select: { nome: true } },
      },
    }),
  ])

  return {
    bugs: { abertos: bugsAbertos, andamento: bugsAndamento, resolvidos: bugsResolvidos, criticos: bugsCriticos },
    casos: { total: casosTotal, executados: casosExecutados, aprovados: casosAprovados, reprovados: casosReprovados },
    cobertura: casosTotal > 0 ? Math.round((casosExecutados / casosTotal) * 100) : 0,
    projetos, solicitacoesPendentes, ultimosBugs, ultimasExecucoes,
  }
}

function mensagemDescanso(): string {
  const hoje = new Date()
  const dow = hoje.getDay()
  if (isDiaDescanso(hoje)) {
    const motivo = dow === 6 ? 'sábado' : dow === 0 ? 'domingo' : 'feriado'
    const frases = [
      `Trabalhando no ${motivo}? Você é diferenciado! 💪`,
      `No ${motivo} e aqui firme! Dedicação de verdade. 🔥`,
      `Enquanto o mundo descansa, você faz acontecer. Respeito! 🫡`,
    ]
    return frases[Math.floor(Math.random() * frases.length)]
  }
  // Próximo descanso
  let dias = 1
  let prox = new Date(hoje)
  while (!isDiaDescanso(new Date(prox.getTime() + dias * 86400000))) dias++
  prox = new Date(hoje.getTime() + dias * 86400000)
  const motivo = prox.getDay() === 6 ? 'Sábado' : prox.getDay() === 0 ? 'Domingo' : 'Feriado'
  if (dias === 1) return `Amanhã é ${motivo}! Quase lá. 🎉`
  if (dias <= 3) return `Faltam ${dias} dias para o ${motivo}. Vai valendo! 💪`
  return `Faltam ${dias} dias para o ${motivo}. Bora com tudo! 🚀`
}

const SEVERIDADE_BADGE: Record<string, string> = {
  Crítico: 'badge-danger',
  Alto:    'bg-orange-500/15 text-orange-400 border border-orange-500/20 badge',
  Médio:   'badge-warning',
  Baixo:   'badge-muted',
}

const STATUS_BADGE: Record<string, string> = {
  Aberto:              'badge-danger',
  'Em análise':        'badge-warning',
  'Em correção':       'badge-info',
  'Aguardando reteste':'badge-warning',
  Resolvido:           'badge-success',
  Fechado:             'badge-muted',
  Reaberto:            'badge-danger',
}

const RESULTADO_BADGE: Record<string, string> = {
  Aprovado:       'badge-success',
  Reprovado:      'badge-danger',
  Bloqueado:      'badge-warning',
  'Não executado':'badge-muted',
  Ignorado:       'badge-muted',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getStats(Number(session!.user.id))
  const coberturaBar = Math.min(stats.cobertura, 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">{mensagemDescanso()}</p>
        </div>
        {stats.bugs.criticos > 0 && (
          <a href="/bugs?severidade=Crítico" className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/25 text-status-danger text-sm px-3 py-2 rounded-lg hover:bg-status-danger/15 transition-all">
            <AlertTriangle className="w-4 h-4" />
            {stats.bugs.criticos} bug{stats.bugs.criticos > 1 ? 's' : ''} crítico{stats.bugs.criticos > 1 ? 's' : ''}
          </a>
        )}
      </div>

      {/* KPI Cards — Bugs */}
      <div>
        <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">Bugs</p>
        <div className="grid grid-cols-3 gap-4">
          <KpiCard
            label="Abertos" value={stats.bugs.abertos}
            icon={<Bug className="w-4 h-4" />}
            color="danger" href="/bugs?status=Aberto"
          />
          <KpiCard
            label="Em andamento" value={stats.bugs.andamento}
            icon={<Activity className="w-4 h-4" />}
            color="warning" href="/bugs?status=Em análise"
          />
          <KpiCard
            label="Resolvidos" value={stats.bugs.resolvidos}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="success" href="/bugs?status=Resolvido"
          />
        </div>
      </div>

      {/* KPI Cards — Testes + Cobertura */}
      <div>
        <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">Testes</p>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total" value={stats.casos.total} icon={<TestTube2 className="w-4 h-4" />} color="info" href="/casos-teste" />
          <KpiCard label="Executados" value={stats.casos.executados} icon={<Clock className="w-4 h-4" />} color="info" href="/casos-teste" />
          <KpiCard label="Aprovados" value={stats.casos.aprovados} icon={<CheckCircle2 className="w-4 h-4" />} color="success" href="/casos-teste" />
          <KpiCard label="Reprovados" value={stats.casos.reprovados} icon={<XCircle className="w-4 h-4" />} color="danger" href="/casos-teste" />
        </div>

        {/* Barra de cobertura */}
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-text-primary">Cobertura de testes</span>
            </div>
            <span className="font-mono text-lg font-bold text-accent">{stats.cobertura}%</span>
          </div>
          <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${coberturaBar}%` }}
            />
          </div>
          <p className="text-text-muted text-xs mt-1.5">
            {stats.casos.executados} de {stats.casos.total} casos executados
          </p>
        </div>
      </div>

      {/* Linha inferior: Últimos bugs + Projetos + Execuções */}
      <div className="grid grid-cols-3 gap-4">
        {/* Últimos bugs */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-primary">Últimos bugs</h3>
            <a href="/bugs" className="text-xs text-accent hover:text-accent-hover transition-colors">Ver todos →</a>
          </div>
          {stats.ultimosBugs.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">Nenhum bug registrado</p>
          ) : (
            <div className="space-y-2">
              {stats.ultimosBugs.map((bug: any) => (
                <a key={bug.id} href={`/bugs/${bug.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated transition-all group">
                  <span className={SEVERIDADE_BADGE[bug.severidade] || 'badge-muted'}>{bug.severidade}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate group-hover:text-accent transition-colors">{bug.titulo}</p>
                    <p className="text-xs text-text-muted">{bug.projeto?.nome}</p>
                  </div>
                  <span className={STATUS_BADGE[bug.status] || 'badge-muted'}>{bug.status}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Projetos ativos */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-text-primary">Projetos ativos</h3>
              <a href="/projetos" className="text-xs text-accent hover:text-accent-hover">Ver todos →</a>
            </div>
            {stats.projetos.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-3">Nenhum projeto</p>
            ) : (
              <div className="space-y-2">
                {stats.projetos.map((p: any) => (
                  <a key={p.id} href={`/projetos/${p.id}`}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                    <FolderKanban className="w-3.5 h-3.5 text-accent/60 flex-shrink-0" />
                    <span className="truncate">{p.nome}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Solicitações pendentes */}
          {stats.solicitacoesPendentes > 0 && (
            <a href="/solicitacoes" className="card flex items-center gap-3 hover:border-border-strong transition-all group">
              <div className="w-8 h-8 rounded-lg bg-status-warning/15 border border-status-warning/25 flex items-center justify-center">
                <Bell className="w-4 h-4 text-status-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                  {stats.solicitacoesPendentes} solicitaç{stats.solicitacoesPendentes > 1 ? 'ões' : 'ão'}
                </p>
                <p className="text-xs text-text-muted">aguardando análise</p>
              </div>
            </a>
          )}

          {/* Últimas execuções */}
          <div className="card">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-3">Execuções recentes</h3>
            {stats.ultimasExecucoes.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-3">Nenhuma execução</p>
            ) : (
              <div className="space-y-2">
                {stats.ultimasExecucoes.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <span className={RESULTADO_BADGE[e.resultado] || 'badge-muted'}>{e.resultado}</span>
                    <p className="text-xs text-text-secondary truncate flex-1">{e.casoTeste?.titulo}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: 'danger' | 'warning' | 'success' | 'info'
  href: string
}

const COLOR_MAP = {
  danger:  { bg: 'bg-status-danger/10',   border: 'border-status-danger/20',   text: 'text-status-danger',   icon: 'bg-status-danger/15'  },
  warning: { bg: 'bg-status-warning/10',  border: 'border-status-warning/20',  text: 'text-status-warning',  icon: 'bg-status-warning/15' },
  success: { bg: 'bg-status-success/10',  border: 'border-status-success/20',  text: 'text-status-success',  icon: 'bg-status-success/15' },
  info:    { bg: 'bg-status-info/10',     border: 'border-status-info/20',     text: 'text-status-info',     icon: 'bg-status-info/15'    },
}

function KpiCard({ label, value, icon, color, href }: KpiCardProps) {
  const c = COLOR_MAP[color]
  return (
    <a href={href} className={`card flex items-center gap-3 hover:border-border-strong transition-all group cursor-pointer`}>
      <div className={`w-9 h-9 rounded-lg ${c.icon} flex items-center justify-center ${c.text} flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`font-display font-bold text-2xl ${c.text}`}>{value}</p>
        <p className="text-text-muted text-xs">{label}</p>
      </div>
    </a>
  )
}
