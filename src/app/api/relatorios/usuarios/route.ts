import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const usuarios = await prisma.usuario.findMany({
    include: {
      bugsReportados: { select: { id: true } },
      execucoes: { select: { id: true } },
      auditoria: { select: { id: true }, orderBy: { criadoEm: 'desc' }, take: 1 },
    },
  })

  const rows = usuarios.map(u => ({
    Nome: u.nome,
    Login: u.login,
    Email: u.email,
    Cargo: u.cargo,
    Situação: u.situacao,
    'Bugs Reportados': u.bugsReportados.length,
    'Execuções': u.execucoes.length,
    'Criado em': new Date(u.criadoEm).toLocaleDateString('pt-BR'),
    'Última ação': u.auditoria[0] ? new Date((u.auditoria[0] as any).criadoEm).toLocaleDateString('pt-BR') : '—',
  }))

  return NextResponse.json({ rows, titulo: 'Relatório de Usuários', total: usuarios.length })
}
