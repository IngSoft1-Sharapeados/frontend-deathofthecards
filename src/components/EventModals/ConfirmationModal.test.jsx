import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ConfirmationModal from './ConfirmationModal';

describe('ConfirmationModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  test('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <ConfirmationModal isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza con valores por defecto cuando isOpen es true', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onConfirm={mockOnConfirm}
        title="Test Title"
        message="Test Message"
      />
    );

    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(1); // El input numérico tiene valor 1 por defecto
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  test('permite al usuario cambiar el valor del input dentro de los límites', () => {
    render(<ConfirmationModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '3' } });
    expect(input).toHaveValue(3);
    
    // Prueba el límite superior
    fireEvent.change(input, { target: { value: '9' } });
    expect(input).toHaveValue(5);
    
    // Prueba el límite inferior
    fireEvent.change(input, { target: { value: '0' } });
    expect(input).toHaveValue(1);
  });

  test('llama a onConfirm con el valor del input al hacer click en Confirmar', () => {
    render(<ConfirmationModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    const input = screen.getByRole('spinbutton');
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });

    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith(4);
  });

  test('llama a onClose al hacer click en Cancelar', () => {
    render(<ConfirmationModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('llama a onClose al hacer click en el overlay', () => {
    render(<ConfirmationModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);
    const overlay = screen.getByRole('heading').parentElement.parentElement;
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});