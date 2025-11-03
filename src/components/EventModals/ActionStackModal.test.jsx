import React from 'react';
import { render, act, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActionStackModal from './ActionStackModal'; // Asegúrate de que la ruta sea correcta
import { cardService } from '@/services/cardService';

// --- Mocks ---

vi.mock('./ActionStackModal.module.css', () => ({
  default: {
    overlay: 'overlay-mock',
    modal: 'modal-mock',
    message: 'message-mock',
    cardContainer: 'cardContainer-mock',
    responseStack: 'responseStack-mock',
    statusMessage: 'statusMessage-mock',
  }
}));

vi.mock('@/services/cardService', () => ({
  cardService: {
    getCardImageUrl: vi.fn(),
  }
}));

// --- Datos de Mockeo para los Tests ---

const mockCartaOriginal = {
  id_carta_tipo: 7,
  nombre: 'H. Poirot',
};

const mockRespuesta1 = {
  id_carta_tipo: 16, // Not So Fast
  nombre: 'Not So Fast',
};

const mockAccionBase = {
  mensaje: "Fran jugó 'Set de Detectives'",
  nombre_accion: 'Set de Detectives',
  carta_original: mockCartaOriginal,
  pila_respuestas: []
};

const mockAccionPilaImpar = {
  ...mockAccionBase,
  pila_respuestas: [mockRespuesta1]
};

const mockAccionPilaPar = {
  ...mockAccionBase,
  pila_respuestas: [mockRespuesta1, mockRespuesta1]
};

// --- Inicio de los Tests ---

describe('ActionStackModal', () => {

  // --- INICIO DE LA MODIFICACIÓN ---
  // Configurar timers falsos para 'setInterval'
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'setInterval');  
    vi.spyOn(global, 'clearInterval'); 
    vi.mocked(cardService.getCardImageUrl).mockImplementation((id) => `url-para-id-${id}.png`);
  });
  // --- FIN DE LA MODIFICACIÓN ---

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  // --- Tests de Renderizado (Estos ya pasaban) ---

  it('no debería renderizar nada si la prop "accion" es null', () => {
    const { container } = render(<ActionStackModal accion={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('no debería renderizar nada si "accion" no tiene "carta_original"', () => {
    const { container } = render(<ActionStackModal accion={{ mensaje: 'Cargando...' }} />);
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar los elementos base cuando recibe una acción', () => {
    render(<ActionStackModal accion={mockAccionBase} />);
    expect(screen.getByText('¡Acción en Progreso!')).toBeDefined();
    expect(screen.getByText(mockAccionBase.mensaje)).toBeDefined();
    expect(screen.getByText(mockAccionBase.carta_original.nombre)).toBeDefined();
    expect(cardService.getCardImageUrl).toHaveBeenCalledWith(mockAccionBase.carta_original.id_carta_tipo);
  });

  it('debería mostrar el mensaje de fallback "Respondiendo a:" si "accion.mensaje" es null', () => {
    const accionSinMensaje = { ...mockAccionBase, mensaje: null };
    render(<ActionStackModal accion={accionSinMensaje} />);
    expect(screen.getByText('Respondiendo a:')).toBeDefined();
    expect(screen.queryByText(mockAccionBase.mensaje)).toBeNull();
  });

  it('debería usar "accion.nombre_accion" como fallback para el label de la carta', () => {
    const accionSinNombreCarta = {
      ...mockAccionBase,
      carta_original: { id_carta_tipo: 7 }
    };
    render(<ActionStackModal accion={accionSinNombreCarta} />);
    expect(screen.getByText(accionSinNombreCarta.nombre_accion)).toBeDefined();
  });

  // --- Tests de Lógica de Pila (Estos ya pasaban) ---

  it('NO debería mostrar la sección de la pila si "pila_respuestas" está vacía', () => {
    render(<ActionStackModal accion={mockAccionBase} />);
    expect(screen.queryByText('Respuestas en la Pila:')).toBeNull();
    expect(screen.queryByText('La acción original se ejecutará.')).toBeNull();
  });

  it('debería mostrar la pila y el estado "CANCELADA" si hay 1 respuesta (Impar)', () => {
    render(<ActionStackModal accion={mockAccionPilaImpar} />);
    expect(screen.getByText('Respuestas en la Pila:')).toBeDefined();
    expect(cardService.getCardImageUrl).toHaveBeenCalledWith(mockRespuesta1.id_carta_tipo);
    expect(screen.getByText('La acción original será cancelada.')).toBeDefined();
    expect(screen.queryByText('La acción original se ejecutará.')).toBeNull();
  });

  it('debería mostrar la pila y el estado "EJECUTARÁ" si hay 2 respuestas (Par)', () => {
    render(<ActionStackModal accion={mockAccionPilaPar} />);
    expect(screen.getByText('Respuestas en la Pila:')).toBeDefined();
    expect(screen.getByText('La acción original se ejecutará.')).toBeDefined();
    expect(screen.queryByText('La acción original será cancelada.')).toBeNull();
  });

  // --- Tests del Timer (Estos son los que fallaban) ---

  it('debería iniciar un setInterval al montarse con una acción', () => {
    render(<ActionStackModal accion={mockAccionBase} durationSeconds={5} />);
    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('debería limpiar el timer (clearInterval) si el componente se desmonta', () => {
    const { unmount } = render(<ActionStackModal accion={mockAccionBase} />);
    expect(setInterval).toHaveBeenCalledTimes(1);

    act(() => {
      unmount();
    });

    expect(clearInterval).toHaveBeenCalledTimes(1); 
  });

  it('debería reiniciar el timer si la prop "accion" cambia (pila actualizada)', () => {
    const { rerender } = render(<ActionStackModal accion={mockAccionBase} />);
    expect(setInterval).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      rerender(<ActionStackModal accion={mockAccionPilaImpar} />);
    });

    expect(clearInterval).toHaveBeenCalledTimes(1); 
    expect(setInterval).toHaveBeenCalledTimes(2);
  });
});