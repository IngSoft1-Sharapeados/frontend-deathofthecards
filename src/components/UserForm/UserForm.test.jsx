import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserForm from '@/components/UserForm/UserForm.jsx'; // Asegúrate que la ruta al componente sea correcta

// Mock de las props que el componente espera (funciones onSubmit y onClose)
const mockOnSubmit = vi.fn();
const mockOnClose = vi.fn();

describe('UserForm', () => {

  // Limpiamos los mocks antes de cada test para asegurar que las pruebas estén aisladas
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado Inicial y Estado por Defecto', () => {
    it('renderiza el formulario con todos sus campos y botones', () => {
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Verifica que el título, los campos de entrada y los botones estén en el documento
      expect(screen.getByRole('heading', { name: /completa tu información/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fecha de cumpleaños/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('los campos del formulario deben estar inicialmente vacíos', () => {
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText(/nombre de usuario/i).value).toBe('');
      expect(screen.getByLabelText(/fecha de cumpleaños/i).value).toBe('');
    });
  });

  describe('Interacción del Usuario', () => {
    it('permite al usuario escribir en los campos de entrada', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      
      const usernameInput = screen.getByLabelText(/nombre de usuario/i);
      const birthdayInput = screen.getByLabelText(/fecha de cumpleaños/i);

      await user.type(usernameInput, 'testuser');
      await user.type(birthdayInput, '2023-10-27');

      // Verifica que el valor de los inputs se actualiza correctamente
      expect(usernameInput.value).toBe('testuser');
      expect(birthdayInput.value).toBe('2023-10-27');
    });
  });

  describe('Validación del Formulario', () => {
    it('muestra mensajes de error si se intenta enviar el formulario con campos vacíos', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      // Verifica que los mensajes de error aparecen
      expect(await screen.findByText('El nombre de usuario es obligatorio.')).toBeInTheDocument();
      expect(screen.getByText('La fecha de cumpleaños es obligatoria.')).toBeInTheDocument();

      // La función onSubmit no debería haber sido llamada
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('elimina el mensaje de error de un campo cuando el usuario empieza a escribir en él', async () => {
        const user = userEvent.setup();
        render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
        
        // Primero, forzamos la aparición del error
        await user.click(screen.getByRole('button', { name: /guardar/i }));
        const errorMessage = await screen.findByText('El nombre de usuario es obligatorio.');
        expect(errorMessage).toBeInTheDocument();
        
        // Luego, escribimos en el campo
        const usernameInput = screen.getByLabelText(/nombre de usuario/i);
        await user.type(usernameInput, 'a');

        // El mensaje de error debería desaparecer
        expect(screen.queryByText('El nombre de usuario es obligatorio.')).not.toBeInTheDocument();
    });
  });

  describe('Envío y Cierre del Formulario', () => {
    it('llama a onSubmit con los datos correctos y luego a onClose cuando el formulario es válido', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const usernameInput = screen.getByLabelText(/nombre de usuario/i);
      const birthdayInput = screen.getByLabelText(/fecha de cumpleaños/i);
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(birthdayInput, '2023-10-27');
      await user.click(submitButton);

      // Verifica que onSubmit fue llamado con los datos correctos
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        birthday: '2023-10-27',
      });
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);

      // Verifica que onClose también fue llamado después del envío
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('llama a onClose cuando se hace clic en el botón "Cancelar"', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Solo onClose debería ser llamado
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('llama a onClose cuando se hace clic en el botón de cierre (X)', async () => {
        const user = userEvent.setup();
        render(<UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
        
        const closeButton = screen.getByLabelText(/cerrar modal/i);
        await user.click(closeButton);
  
        // Solo onClose debería ser llamado
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});