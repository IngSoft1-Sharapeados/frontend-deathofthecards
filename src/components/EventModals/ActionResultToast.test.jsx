import React from 'react';
import { render, act, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActionResultToast from './ActionResultToast'; // Asegúrate de que la ruta sea correcta

// 1. Mockear los estilos CSS
// Esto evita que el test falle al intentar importar un archivo .css
vi.mock('./ActionResultToast.module.css', () => ({
  default: {
    toast: 'toast-mock-class' // Damos una clase falsa
  }
}));

describe('ActionResultToast', () => {

  // 2. Configurar "timers falsos"
  // Esto nos permite controlar el 'setTimeout'
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanup(); // Limpiar el DOM después de cada test
  });

  // Test 1: El estado por defecto (sin mensaje)
  it('no debería renderizar nada si el mensaje es null o undefined', () => {
    const { container } = render(<ActionResultToast message={null} onClose={() => {}} />);
    // El componente debe devolver 'null', así que el contenedor estará vacío
    expect(container.firstChild).toBeNull();
  });

  // Test 2: Renderizado con mensaje
  it('debería renderizar el mensaje y empezar un timer cuando recibe un mensaje', () => {
    const mockOnClose = vi.fn();
    render(<ActionResultToast message="Acción exitosa" onClose={mockOnClose} />);

    // Verifica que el texto está en el documento
    expect(screen.getByText('Acción exitosa')).toBeDefined();
    
    // Verifica que el timer se inició
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);

    // Verifica que onClose AÚN no ha sido llamado
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Test 3: El timer se completa y llama a onClose
  it('debería llamar a onClose después de 3 segundos', () => {
    const mockOnClose = vi.fn();
    render(<ActionResultToast message="Acción cancelada" onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Adelantamos el reloj 3 segundos
    act(() => {
      vi.runAllTimers();
    });

    // Ahora sí debe haber sido llamado
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test 4: El componente se desmonta antes de tiempo (Cleanup)
  it('debería limpiar el timer y NO llamar a onClose si el componente se desmonta', () => {
    const mockOnClose = vi.fn();
    // 'unmount' viene de render
    const { unmount } = render(<ActionResultToast message="Acción..." onClose={mockOnClose} />);

    expect(setTimeout).toHaveBeenCalledTimes(1);

    // Desmontamos el componente
    act(() => {
      unmount();
    });

    // Verificamos que el timer se limpió
    expect(clearTimeout).toHaveBeenCalledTimes(1);

    // Adelantamos el reloj para estar seguros de que no se llama
    act(() => {
      vi.runAllTimers();
    });

    // onClose NUNCA debe ser llamado
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Test 5: El mensaje cambia (Rerender y Cleanup)
  it('debería reiniciar el timer si el mensaje cambia', () => {
    const mockOnClose = vi.fn();
    const { rerender } = render(<ActionResultToast message="Mensaje 1" onClose={mockOnClose} />);

    expect(setTimeout).toHaveBeenCalledTimes(1);

    // Adelantamos el reloj 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Cambiamos el mensaje (provoca un rerender)
    act(() => {
      rerender(<ActionResultToast message="Mensaje 2" onClose={mockOnClose} />);
    });

    // 1. El timer viejo (de Mensaje 1) debió ser limpiado
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    // 2. Un nuevo timer (para Mensaje 2) debió iniciarse
    expect(setTimeout).toHaveBeenCalledTimes(2);

    // Adelantamos 2.5 segundos (Total 3.5s). El primer timer ya habría terminado,
    // pero el segundo (reiniciado) no.
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Aún no debe llamarse
    expect(mockOnClose).not.toHaveBeenCalled();

    // Adelantamos 0.5 segundos más (Total 3s para el *segundo* timer)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Ahora sí
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});