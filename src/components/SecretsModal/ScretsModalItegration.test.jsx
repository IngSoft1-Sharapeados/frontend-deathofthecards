import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import SecretsModal from '@/components/SecretsModal/SecretsModal.jsx';
import useSecretActions from '@/hooks/useSecretActions';
import '@testing-library/jest-dom';

vi.mock('@/services/apiService', () => ({
    apiService: {
        revealSecret: vi.fn(() => Promise.resolve({ ok: true })),
        hideSecret: vi.fn(() => Promise.resolve({ ok: true })),
        robSecret: vi.fn(() => Promise.resolve({ ok: true })),
        getPlayerSecrets: vi.fn(() => Promise.resolve([])),
    },
}));


vi.mock('@/components/Card/Card', () => ({
    default: ({ imageName }) => <div data-testid="card">{imageName}</div>,
}));

describe('SecretsModal', () => {
    const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        player: { nombre_jugador: 'Jugador 1' },
        isLoading: false,
        onSecretSelect: vi.fn(),
        onRevealSecret: vi.fn(),
        onHideSecret: vi.fn(),
        onRobSecret: vi.fn(),
        secrets: [
        { id: 1, bocaArriba: false, url: 'img1.png' },
        { id: 2, bocaArriba: true, url: 'img2.png' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('muestra el botón "Revelar secreto" cuando la carta seleccionada está oculta', () => {
        render(
            <SecretsModal
                {...baseProps}
                selectedSecret={1}
                canRevealSecrets={true}
                canHideSecrets={true}
                canRobSecrets={true}
            />
        );

        expect(screen.getByText('Revelar secreto')).toBeInTheDocument();
        expect(screen.queryByText('Ocultar secreto')).not.toBeInTheDocument();
        expect(screen.queryByText('Robar secreto')).not.toBeInTheDocument();

    });

    test('muestra los botones "Ocultar" y "Robar" cuando la carta seleccionada está revelada', () => {
        render(
            <SecretsModal
                {...baseProps}
                selectedSecret={2}
                canRevealSecrets={true}
                canHideSecrets={true}
                canRobSecrets={true}
            />
        );


        expect(screen.getByText('Ocultar secreto')).toBeInTheDocument();
        expect(screen.getByText('Robar secreto')).toBeInTheDocument();
        expect(screen.queryByText('Revelar secreto')).not.toBeInTheDocument();


    });

    test('no muestra botones si no hay carta seleccionada', () => {
        render(
            <SecretsModal
            {...baseProps}
            selectedSecret={null}
            canRevealSecrets={true}
            canHideSecrets={true}
            canRobSecrets={true}
            />
        );

        expect(screen.queryByText('Revelar secreto')).not.toBeInTheDocument();
        expect(screen.queryByText('Ocultar secreto')).not.toBeInTheDocument();
        expect(screen.queryByText('Robar secreto')).not.toBeInTheDocument();

    });
}); 

// Tests de llamadas a la API usando useSecretActions
import { renderHook, act } from '@testing-library/react';
import { apiService } from '@/services/apiService';

describe('useSecretActions', () => {
    const mockSet = vi.fn((f) => f([]));

    const gameState = {
    currentPlayerId: 99,
    playerSecretsData: [],
    setPlayerSecretsData: vi.fn(),
    selectedSecretCard: 42,
    setSelectedSecretCard: vi.fn(),
    canRevealSecrets: true,
    setCanRevealSecrets: vi.fn(),
    canHideSecrets: true,
    setCanHideSecrets: vi.fn(),
    canRobSecrets: true,
    setCanRobSecrets: vi.fn(),
    };

    test('llama a apiService.revealSecret con los parámetros correctos', async () => {
        const { result } = renderHook(() => useSecretActions(7, gameState));


        await act(async () => {
        await result.current.handleRevealSecret(99);
        });

        expect(apiService.revealSecret).toHaveBeenCalledWith(7, 99, 42);
    });

    test('llama a apiService.hideSecret con los parámetros correctos', async () => {
        const { result } = renderHook(() => useSecretActions(7, gameState));

        await act(async () => {
        await result.current.handleHideSecret(99);
        });

        expect(apiService.hideSecret).toHaveBeenCalledWith(7, 99, 42);

    });

    test('llama a apiService.robSecret con los parámetros correctos', async () => {
        const { result } = renderHook(() => useSecretActions(7, gameState));

        await act(async () => {
        await result.current.handleRobSecret(123);
        });

        expect(apiService.robSecret).toHaveBeenCalledWith(7, 99, 123, 42);

    });


});
