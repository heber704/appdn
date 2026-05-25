// src/app/api/projetos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const projeto = await prisma.projeto.findUnique({
    where: { id: Number(params.id) },
    include: {
      membros: { include: { usuario: { select: { id: true, nome: true, cargo: true } } } },
      _count: { select: { bugs: true, casosTeste: true, ciclos: true, requisitos: true } },
    },
  })

  if (!projeto) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  return NextResponse.json(projeto)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, descricao, status, dataInicio, dataPrevisao } = body

  const projeto = await prisma.projeto.update({
    where: { id: Number(params.id) },
    data: {
      ...(nome && { nome: nome.trim() }),
      ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
      ...(status && { status }),
      ...(dataInicio && { dataInicio: new Date(dataInicio) }),
      ...(dataPrevisao !== undefined && { dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null }),
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'EDITAR',
      entidade: 'projetos',
      entidadeId: projeto.id,
      detalhes: `Projeto "${projeto.nome}" editado`,
    },
  })

  return NextResponse.json(projeto)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const projeto = await prisma.projeto.findUnique({ where: { id: Number(params.id) } })
  if (!projeto) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.projeto.delete({ where: { id: Number(params.id) } })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'EXCLUIR',
      entidade: 'projetos',
      entidadeId: Number(params.id),
      detalhes: `Projeto "${projeto.nome}" excluído`,
    },
  })

  return NextResponse.json({ success: true })
}
