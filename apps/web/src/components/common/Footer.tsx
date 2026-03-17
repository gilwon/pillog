import { Disclaimer } from './Disclaimer'
import { Pill } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Disclaimer />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            데이터 출처:{' '}
            <a
              href="https://www.foodsafetykorea.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-muted-foreground/30 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/30"
            >
              식품의약품안전처 식품안전나라
            </a>
          </p>
          <div className="flex items-center gap-1.5 text-muted-foreground/70">
            <Pill className="h-3.5 w-3.5" />
            <span>Pillog {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
