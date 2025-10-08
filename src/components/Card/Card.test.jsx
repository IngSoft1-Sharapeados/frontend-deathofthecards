import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import Card from '@/components/Card/Card.jsx';

// Línea clave: Le decimos a Vitest que use los "matchers" de jest-dom
expect.extend(matchers);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Card', () => {
  const mockOnCardClick = vi.fn();

  describe('Default State', () => {
    it('debe renderizar la carta con imagen cuando imageName está presente', () => {
      render(
        <Card 
          imageName="test-card.png" 
          onCardClick={mockOnCardClick}
        />
      );

      const cardImage = screen.getByAltText('Carta test-card.png');
      expect(cardImage).toBeInTheDocument();
      expect(cardImage).toHaveAttribute('src');
    });

    it('no debe renderizar nada cuando imageName no está presente', () => {
      const { container } = render(
        <Card 
          imageName="" 
          onCardClick={mockOnCardClick}
        />
      );

      expect(container.firstChild).toBeNull();
    });

  });

  describe('User Interactions', () => {
    it('debe llamar onCardClick cuando se hace clic en la carta', () => {
      render(
        <Card 
          imageName="test-card.png" 
          onCardClick={mockOnCardClick}
        />
      );

      const cardElement = screen.getByAltText('Carta test-card.png').parentElement;
      fireEvent.click(cardElement);

      expect(mockOnCardClick).toHaveBeenCalledTimes(1);
    });

    it('no debe fallar cuando onCardClick no está definido', () => {
      render(
        <Card 
          imageName="test-card.png"
        />
      );

      const cardElement = screen.getByAltText('Carta test-card.png').parentElement;
      
      expect(() => {
        fireEvent.click(cardElement);
      }).not.toThrow();
    });
  });

  describe('UI Elements', () => {
    it('debe tener la clase CSS base para el estilo', () => {
      const { container } = render(
        <Card 
          imageName="test-card.png" 
          onCardClick={mockOnCardClick}
        />
      );

      const cardElement = container.firstChild;
      expect(cardElement.className).toContain('card');
    });

    it('debe agregar la clase selected cuando isSelected es true', () => {
      const { container } = render(
        <Card 
          imageName="test-card.png" 
          isSelected={true}
          onCardClick={mockOnCardClick}
        />
      );

      const cardElement = container.firstChild;
      expect(cardElement.className).toContain('selected');
    });

    it('no debe tener la clase selected cuando isSelected es false', () => {
      const { container } = render(
        <Card 
          imageName="test-card.png" 
          isSelected={false}
          onCardClick={mockOnCardClick}
        />
      );

      const cardElement = container.firstChild;
      expect(cardElement.className).not.toContain('selected');
    });
  });
});