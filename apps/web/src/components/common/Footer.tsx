import { Disclaimer } from './Disclaimer'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Disclaimer />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            데이터 출처:{' '}
            <a
              href="https://www.foodsafetykorea.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              식품의약품안전처 식품안전나라
            </a>
          </p>
          <p>Pillog {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
