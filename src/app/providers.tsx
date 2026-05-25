'use client'
// src/app/providers.tsx
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#f0f0f8',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#16161f' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#16161f' },
          },
        }}
      />
    </SessionProvider>
  )
}
