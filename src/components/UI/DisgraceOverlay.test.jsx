import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect } from 'vitest';
import DisgraceOverlay from './DisgraceOverlay';

describe('DisgraceOverlay', () => {
  test('renderiza todos los elementos visuales correctamente', () => {
    render(<DisgraceOverlay />);

    // Verifica que el ícono de payaso esté presente
    expect(screen.getByText('🤡')).toBeInTheDocument();

    // Verifica que el mensaje principal esté presente
    expect(screen.getByText('Estás en Desgracia Social')).toBeInTheDocument();

    // Verifica que el texto de instrucción esté presente
    expect(screen.getByText('Solo puedes descartar 1 carta para pasar.')).toBeInTheDocument();
  });
});