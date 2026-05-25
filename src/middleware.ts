// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas só para admin
    const adminRoutes = ['/usuarios', '/auditoria']
    const isAdminRoute = adminRoutes.some(r => path.startsWith(r))

    if (isAdminRoute && token?.cargo !== 'Administrador') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projetos/:path*',
    '/bugs/:path*',
    '/casos-teste/:path*',
    '/ciclos/:path*',
    '/requisitos/:path*',
    '/relatorios/:path*',
    '/usuarios/:path*',
    '/auditoria/:path*',
    '/notificacoes/:path*',
    '/conta/:path*',
  ],
}
