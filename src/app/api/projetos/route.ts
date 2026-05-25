// src/app/api/projetos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const projetos = await prisma.projeto.findMany({
    where: {
      ...(status && { status }),
      ...(q && { nome: { contains: q } }),
    },
    include: {
      membros: { include: { usuario: { select: { id: true, nome: true } } } },
      _count: { select: { bugs: true, casosTeste: true, ciclos: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(projetos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, descricao, dataInicio, dataPrevisao, status } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (!dataInicio) return NextResponse.json({ error: 'Data de início obrigatória' }, { status: 400 })

  const projeto = await prisma.projeto.create({
    data: {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      status: status || 'Em andamento',
      dataInicio: new Date(dataInicio),
      dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null,
      membros: {
        create: { usuarioId: Number(session.user.id), papel: 'Criador' },
      },
    },
  })

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'CRIAR',
      entidade: 'projetos',
      entidadeId: projeto.id,
      detalhes: `Projeto "${nome}" criado`,
    },
  })

  return NextResponse.json(projeto, { status: 201 })
}
