// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [
    bugsAbertos, bugsAndamento, bugsResolvidos,
    casosTotal, casosExecutados, casosAprovados, casosReprovados,
    projetos, solicitacoesPendentes, notificacoesNaoLidas,
    ultimosBugs, ultimasExecucoes,
  ] = await Promise.all([
    prisma.bug.count({ where: { status: 'Aberto' } }),
    prisma.bug.count({ where: { status: { in: ['Em análise', 'Em correção'] } } }),
    prisma.bug.count({ where: { status: { in: ['Resolvido', 'Fechado'] } } }),
    prisma.casoTeste.count(),
    prisma.execucaoTeste.count({ where: { resultado: { not: 'Não executado' } } }),
    prisma.execucaoTeste.count({ where: { resultado: 'Aprovado' } }),
    prisma.execucaoTeste.count({ where: { resultado: 'Reprovado' } }),
    prisma.projeto.findMany({
      where: { status: 'Em andamento' },
      select: { id: true, nome: true, status: true, criadoEm: true },
      take: 5,
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.solicitacao.count({ where: { status: 'Aguardando análise' } }),
    prisma.notificacao.count({
      where: { usuarioId: Number(session.user.id), lida: false },
    }),
    prisma.bug.findMany({
      take: 5,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true, titulo: true, severidade: true, status: true, criadoEm: true,
        projeto: { select: { nome: true } },
      },
    }),
    prisma.execucaoTeste.findMany({
      take: 5,
      orderBy: { iniciadoEm: 'desc' },
      select: {
        id: true, resultado: true, iniciadoEm: true,
        casoTeste: { select: { titulo: true } },
        executor: { select: { nome: true } },
      },
    }),
  ])

  const bugsCriticos = await prisma.bug.count({
    where: { severidade: 'Crítico', status: { notIn: ['Resolvido', 'Fechado'] } },
  })

  const coberturaPercent = casosTotal > 0 ? Math.round((casosExecutados / casosTotal) * 100) : 0

  return NextResponse.json({
    bugs: { abertos: bugsAbertos, andamento: bugsAndamento, resolvidos: bugsResolvidos, criticos: bugsCriticos },
    casos: { total: casosTotal, executados: casosExecutados, aprovados: casosAprovados, reprovados: casosReprovados },
    cobertura: coberturaPercent,
    projetos,
    solicitacoesPendentes,
    notificacoesNaoLidas,
    ultimosBugs,
    ultimasExecucoes,
  })
}
