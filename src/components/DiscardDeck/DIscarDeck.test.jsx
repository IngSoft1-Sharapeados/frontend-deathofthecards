// DiscardDeck.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import DiscardDeck from './DiscardDeck';

// Mock de las imágenes
vi.mock('../../assets/images/cards/misc/01-card_back.png', () => ({
  default: 'mock-card-back.png'
}));

// Mock del componente Card
vi.mock('../Card/Card', () => ({
  default: function MockCard({ imageName, className }) {
    return <div data-testid="card" className={className}>{imageName}</div>;
  }
}));

describe('DiscardDeck', () => {
  const mockCards = [
    { id: 7, nombre: 'Detective Poirot' },
    { id: 8, nombre: 'Miss Marple' },
    { id: 16, nombre: 'Not So Fast' }
  ];

  it('debería renderizar mazo vacío cuando no hay cartas', () => {
    render(<DiscardDeck cards={[]} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('debería mostrar la carta superior correctamente', () => {
    render(<DiscardDeck cards={mockCards} />);
    const topCard = screen.getByTestId('card');
    expect(topCard).toHaveTextContent('16-Instant_notsofast.png');
  });

  it('debería renderizar cartas de fondo para el mazo', () => {
    render(<DiscardDeck cards={mockCards} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('debería convertir correctamente los IDs a nombres de imagen', () => {
    render(<DiscardDeck cards={[{ id: 8, nombre: 'Miss Marple' }]} />);
    const topCard = screen.getByTestId('card');
    expect(topCard).toHaveTextContent('08-detective_marple.png');
  });

  it('debería manejar IDs desconocidos con fallback', () => {
    render(<DiscardDeck cards={[{ id: 999, nombre: 'Unknown' }]} />);
    const topCard = screen.getByTestId('card');
    expect(topCard).toHaveTextContent('card_999.png');
  });
});