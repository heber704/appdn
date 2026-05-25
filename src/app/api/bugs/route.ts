// src/app/api/bugs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severidade = searchParams.get('severidade')
  const prioridade = searchParams.get('prioridade')
  const projetoId = searchParams.get('projeto')
  const responsavelId = searchParams.get('responsavel')
  const q = searchParams.get('q')
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)

  const where: any = {
    ...(status && { status }),
    ...(severidade && { severidade }),
    ...(prioridade && { prioridade }),
    ...(projetoId && { projetoId: Number(projetoId) }),
    ...(responsavelId && { responsavelId: Number(responsavelId) }),
    ...(q && {
      OR: [
        { titulo: { contains: q } },
        { descricao: { contains: q } },
      ],
    }),
  }

  const [bugs, total] = await Promise.all([
    prisma.bug.findMany({
      where,
      include: {
        projeto: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        reportadoPor: { select: { id: true, nome: true } },
        _count: { select: { imagens: true, comentarios: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bug.count({ where }),
  ])

  return NextResponse.json({ bugs, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    titulo, descricao, passosReproducao, resultadoEsperado, resultadoObtido,
    severidade, prioridade, projetoId, requisitoId, responsavelId,
    ambiente, versaoSistema,
  } = body

  if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })
  if (!projetoId) return NextResponse.json({ error: 'Projeto obrigatório' }, { status: 400 })

  const bug = await prisma.bug.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      passosReproducao: passosReproducao?.trim() || null,
      resultadoEsperado: resultadoEsperado?.trim() || null,
      resultadoObtido: resultadoObtido?.trim() || null,
      severidade: severidade || 'Médio',
      prioridade: prioridade || 'Média',
      status: 'Aberto',
      projetoId: Number(projetoId),
      requisitoId: requisitoId ? Number(requisitoId) : null,
      responsavelId: responsavelId ? Number(responsavelId) : null,
      reportadoPorId: Number(session.user.id),
      ambiente: ambiente?.trim() || null,
      versaoSistema: versaoSistema?.trim() || null,
    },
    include: {
      projeto: { select: { nome: true } },
      reportadoPor: { select: { nome: true } },
    },
  })

  // Notifica responsável se atribuído
  if (responsavelId) {
    await prisma.notificacao.create({
      data: {
        usuarioId: Number(responsavelId),
        titulo: 'Bug atribuído a você',
        mensagem: `O bug "${titulo}" foi atribuído a você no projeto "${bug.projeto.nome}".`,
        tipo: 'warning',
      },
    })
  }

  await prisma.auditoria.create({
    data: {
      usuarioId: Number(session.user.id),
      acao: 'CRIAR',
      entidade: 'bugs',
      entidadeId: bug.id,
      detalhes: `Bug "${titulo}" criado`,
    },
  })

  return NextResponse.json(bug, { status: 201 })
}
