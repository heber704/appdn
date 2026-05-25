import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { status, acao } = body

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id: Number(params.id) } })
  if (!solicitacao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  // Converter em bug
  if (acao === 'converter_bug') {
    const bug = await prisma.bug.create({
      data: {
        titulo: solicitacao.titulo,
        descricao: solicitacao.descricao,
        passosReproducao: solicitacao.passos,
        severidade: solicitacao.severidade,
        projetoId: solicitacao.projetoId!,
        reportadoPorId: solicitacao.usuarioId,
        status: 'Aberto',
      },
    })
    await prisma.solicitacao.update({
      where: { id: Number(params.id) },
      data: { status: 'Convertida em Bug' },
    })
    await prisma.auditoria.create({
      data: {
        usuarioId: Number(session.user.id),
        acao: 'CONVERTER',
        entidade: 'solicitacoes',
        entidadeId: Number(params.id),
        detalhes: `Solicitação convertida em Bug #${bug.id}`,
      },
    })
    return NextResponse.json({ bugId: bug.id })
  }

  // Atualizar status
  if (status) {
    const updated = await prisma.solicitacao.update({
      where: { id: Number(params.id) },
      data: { status },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await prisma.solicitacao.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
