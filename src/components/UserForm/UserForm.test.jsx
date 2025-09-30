import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserForm from '@/components/UserForm/UserForm.jsx';
import { MemoryRouter } from 'react-router-dom';
import { apiService } from '@/services/apiService';

vi.mock('@/services/apiService', () => ({
  apiService: {
    // Simulamos que la llamada a la API siempre funciona
    joinGame: vi.fn().mockResolvedValue({ id_jugador: 10 }),
  }
}));



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
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

      // Verifica que el título, los campos de entrada y los botones estén en el documento
      expect(screen.getByRole('heading', { name: /completa tu información/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fecha de cumpleaños/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('los campos del formulario deben estar inicialmente vacíos', () => {
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/nombre de usuario/i).value).toBe('');
      expect(screen.getByLabelText(/fecha de cumpleaños/i).value).toBe('');
    });
  });

  describe('Interacción del Usuario', () => {
    it('permite al usuario escribir en los campos de entrada', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

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
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

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
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

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
    it('llama a apiService.joinGame con los datos correctos y luego a onClose', async () => {
      const user = userEvent.setup();
      // Quitamos mockOnSubmit de aquí porque no se usa
      render(
        <MemoryRouter>
          <UserForm gameId={1} onClose={mockOnClose} />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/nombre de usuario/i);
      const birthdayInput = screen.getByLabelText(/fecha de cumpleaños/i);
      const submitButton = screen.getByRole('button', { name: /guardar/i });

      await user.type(usernameInput, 'testuser');
      await user.type(birthdayInput, '2023-10-27');
      await user.click(submitButton);

      // Verifica que apiService.joinGame fue llamado con los datos correctos
      expect(apiService.joinGame).toHaveBeenCalledWith(1, {
        nombreJugador: 'testuser',
        fechaNacimiento: '2023-10-27',
      });
      expect(apiService.joinGame).toHaveBeenCalledTimes(1);

      // Verifica que onClose también fue llamado después del envío
      // Usamos findByRole para esperar a que las promesas se resuelvan
      await screen.findByRole('button', { name: /guardar/i }); // Pequeña espera
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('llama a onClose cuando se hace clic en el botón "Cancelar"', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Solo onClose debería ser llamado
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('llama a onClose cuando se hace clic en el botón de cierre (X)', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UserForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
        </MemoryRouter>
      );

      const closeButton = screen.getByLabelText(/cerrar modal/i);
      await user.click(closeButton);

      // Solo onClose debería ser llamado
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});