// src/app/api/usuarios/bloquear/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { login } = await req.json()
    if (!login) return NextResponse.json({ error: 'Login obrigatório' }, { status: 400 })

    await prisma.usuario.updateMany({
      where: { login },
      data: { situacao: 'Inativo', bloqueioTipo: 'tentativas' },
    })

    // Auditoria
    const usuario = await prisma.usuario.findUnique({ where: { login } })
    if (usuario) {
      await prisma.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: 'BLOQUEIO_TENTATIVAS',
          entidade: 'usuarios',
          entidadeId: usuario.id,
          detalhes: 'Conta bloqueada por excesso de tentativas de login',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao bloquear' }, { status: 500 })
  }
}
