import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { status, titulo, descricao, objetivo, escopo, estrategia, criteriosEntrada, criteriosSaida, versao } = body

  // Aprovação: só admin/gerente
  if (status === 'APROVADO') {
    const cargo = session.user.cargo
    if (!['Administrador', 'Gerente de Projeto'].includes(cargo)) {
      return NextResponse.json({ error: 'Sem permissão para aprovar' }, { status: 403 })
    }
  }

  const plano = await prisma.planoTeste.update({
    where: { id: Number(params.id) },
    data: {
      ...(status && { status }),
      ...(titulo && { titulo }),
      ...(descricao !== undefined && { descricao }),
      ...(objetivo !== undefined && { objetivo }),
      ...(escopo !== undefined && { escopo }),
      ...(estrategia !== undefined && { estrategia }),
      ...(criteriosEntrada !== undefined && { criteriosEntrada }),
      ...(criteriosSaida !== undefined && { criteriosSaida }),
      ...(versao !== undefined && { versao }),
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: status === 'APROVADO' ? 'APROVAR' : 'ATUALIZAR',
      entidade: 'planos_teste',
      entidadeId: Number(params.id),
      detalhes: status ? `Status alterado para ${status}` : 'Plano atualizado',
    },
  })

  return NextResponse.json(plano)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.planoTeste.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
