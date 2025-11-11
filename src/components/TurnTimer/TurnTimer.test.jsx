import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';

import TurnTimer from '@/components/TurnTimer/TurnTimer';

// Mockeamos los CSS Modules para poder encontrar las clases
vi.mock('@/components/TurnTimer/TurnTimer.module.css', () => ({
  default: {
    timerContainer: 'test-timerContainer',
    timerSvg: 'test-timerSvg',
    timerPathElapsed: 'test-timerPathElapsed',
    timerPathRemaining: 'test-timerPathRemaining',
    timerPathWarning: 'test-timerPathWarning', // La clase que nos importa
    timerLabel: 'test-timerLabel',
  },
}));

describe('TurnTimer Component', () => {

  it('muestra el tiempo restante correctamente', () => {
    render(<TurnTimer timeLeft={42} maxTime={60} />);
    // Verifica que el número 42 esté visible en la pantalla
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calcula el offset del SVG correctamente (a la mitad)', () => {
    // Desestructuramos 'container' de render
    const { container } = render(<TurnTimer timeLeft={30} maxTime={60} />);
    
    // Usamos container.querySelector para encontrar el elemento por su clase
    const progressCircle = container.querySelector('.test-timerPathRemaining');

    // Cálculos del componente:
    const radius = 28;
    const circumference = 2 * Math.PI * radius; // Aprox 175.929
    const expectedOffset = circumference - (30 / 60) * circumference; // Aprox 87.96

    // Verificamos que el 'stroke-dashoffset' se haya calculado como esperamos
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(String(expectedOffset));
  });

  it('aplica la clase de "warning" (peligro) cuando timeLeft es <= 5', () => {
    // Desestructuramos 'container' de render
    const { container } = render(<TurnTimer timeLeft={5} maxTime={60} />);
    
    // Usamos container.querySelector
    const progressCircle = container.querySelector('.test-timerPathRemaining');

    // Debe tener la clase base Y la clase de warning
    expect(progressCircle).toHaveClass('test-timerPathRemaining');
    expect(progressCircle).toHaveClass('test-timerPathWarning');
  });

  it('NO aplica la clase de "warning" (peligro) cuando timeLeft es > 5', () => {
    // Desestructuramos 'container' de render
    const { container } = render(<TurnTimer timeLeft={6} maxTime={60} />);
    
    // Usamos container.querySelector
    const progressCircle = container.querySelector('.test-timerPathRemaining');

    // Debe tener la clase base
    expect(progressCircle).toHaveClass('test-timerPathRemaining');
    // NO debe tener la clase de warning
    expect(progressCircle).not.toHaveClass('test-timerPathWarning');
  });

});