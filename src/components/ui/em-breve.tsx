// src/components/ui/em-breve.tsx
import { Construction } from 'lucide-react'

interface EmBreveProps {
  titulo: string
  descricao?: string
}

export function EmBreve({ titulo, descricao }: EmBreveProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-accent" />
      </div>
      <h2 className="font-display text-xl font-bold text-text-primary mb-2">{titulo}</h2>
      <p className="text-text-secondary text-sm max-w-sm">
        {descricao || 'Esta tela está sendo desenvolvida. Em breve estará disponível.'}
      </p>
    </div>
  )
}
