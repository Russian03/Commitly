import { ListChecksIcon } from '@phosphor-icons/react/ListChecks'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav } from './BottomNav'

const items = ['uno', 'dos', 'tres'].map((id) => ({ id, label: id, icon: ListChecksIcon }))

const buttons = () => within(screen.getByRole('navigation')).getAllByRole('button')

describe('BottomNav', () => {
  it('conserva el orden de lectura aunque cambie la sección activa', () => {
    render(<BottomNav label="Secciones" items={items} active="tres" onSelect={vi.fn()} />)

    expect(buttons().map((button) => button.getAttribute('aria-label'))).toEqual([
      'uno',
      'dos',
      'tres',
    ])
  })

  it('señala solo la sección activa', () => {
    render(<BottomNav label="Secciones" items={items} active="dos" onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName('dos')
    expect(buttons().filter((button) => button.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('avisa de la sección elegida', async () => {
    const onSelect = vi.fn()
    render(<BottomNav label="Secciones" items={items} active="uno" onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: 'tres' }))

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('tres')
  })

  it('tiene nombre accesible', () => {
    render(<BottomNav label="Secciones" items={items} active="uno" onSelect={vi.fn()} />)

    expect(screen.getByRole('navigation')).toHaveAccessibleName('Secciones')
  })
})
