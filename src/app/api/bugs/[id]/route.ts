// src/app/api/bugs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const bug = await prisma.bug.findUnique({
    where: { id: Number(params.id) },
    include: {
      projeto: { select: { id: true, nome: true } },
      requisito: { select: { id: true, titulo: true } },
      responsavel: { select: { id: true, nome: true } },
      reportadoPor: { select: { id: true, nome: true } },
      imagens: { select: { id: true, nome: true, criadoEm: true } },
      historico: { orderBy: { alteradoEm: 'desc' } },
      comentarios: {
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { criadoEm: 'asc' },
      },
    },
  })

  if (!bug) return NextResponse.json({ error: 'Bug não encontrado' }, { status: 404 })
  return NextResponse.json(bug)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const bugAtual = await prisma.bug.findUnique({ where: { id: Number(params.id) } })
  if (!bugAtual) return NextResponse.json({ error: 'Bug não encontrado' }, { status: 404 })

  // Registra histórico de campos alterados
  const historico: any[] = []
  const campos = ['titulo', 'status', 'severidade', 'prioridade', 'responsavelId']
  for (const campo of campos) {
    if (body[campo] !== undefined && String(body[campo]) !== String((bugAtual as any)[campo] ?? '')) {
      historico.push({
        bugId: bugAtual.id,
        campo,
        valorAntes: String((bugAtual as any)[campo] ?? ''),
        valorDepois: String(body[campo]),
      })
    }
  }

  const bug = await prisma.bug.update({
    where: { id: Number(params.id) },
    data: {
      ...(body.titulo && { titulo: body.titulo.trim() }),
      ...(body.descricao !== undefined && { descricao: body.descricao.trim() }),
      ...(body.passosReproducao !== undefined && { passosReproducao: body.passosReproducao }),
      ...(body.resultadoEsperado !== undefined && { resultadoEsperado: body.resultadoEsperado }),
      ...(body.resultadoObtido !== undefined && { resultadoObtido: body.resultadoObtido }),
      ...(body.severidade && { severidade: body.severidade }),
      ...(body.prioridade && { prioridade: body.prioridade }),
      ...(body.status && { status: body.status }),
      ...(body.responsavelId !== undefined && { responsavelId: body.responsavelId ? Number(body.responsavelId) : null }),
      ...(body.ambiente !== undefined && { ambiente: body.ambiente }),
      ...(body.versaoSistema !== undefined && { versaoSistema: body.versaoSistema }),
    },
  })

  if (historico.length > 0) {
    await prisma.historicoBug.createMany({ data: historico })
  }

  // Notifica novo responsável se mudou
  if (body.responsavelId && body.responsavelId !== bugAtual.responsavelId) {
    await prisma.notificacao.create({
      data: {
        usuarioId: Number(body.responsavelId),
        titulo: 'Bug atribuído a você',
        mensagem: `O bug "${bug.titulo}" foi atribuído a você.`,
        tipo: 'warning',
      },
    })
  }

  return NextResponse.json(bug)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.bug.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
