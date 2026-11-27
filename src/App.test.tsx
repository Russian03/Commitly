import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { App } from './App'

describe('App', () => {
  it('muestra el nombre de la app', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Commitly')
  })

  it('muestra la versión de package.json', () => {
    render(<App />)

    expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument()
  })
})
