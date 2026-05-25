// src/app/api/reset-senha/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { login, token } = await req.json()
    if (!login || !token) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

    const usuario = await prisma.usuario.findUnique({ where: { login } })
    if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const reset = await prisma.resetSenha.findFirst({
      where: {
        usuarioId: usuario.id,
        token,
        expiraEm: { gt: new Date() },
      },
    })

    if (!reset) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao verificar código' }, { status: 500 })
  }
}
