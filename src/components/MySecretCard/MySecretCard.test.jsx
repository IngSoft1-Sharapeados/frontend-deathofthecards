import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';
import MySecretCard from './MySecretCard';
import styles from './MySecretCard.module.css';

// Mock del componente Card para aislar la lógica de MySecretCard
vi.mock('@/components/Card/Card', () => ({
    default: ({ imageName }) => <div data-testid="mock-card">{imageName}</div>
}));

describe('MySecretCard', () => {
    const hiddenSecret = {
        id_instancia: 1,
        revelada: false,
        url: 'hidden-secret.png'
    };

    const revealedSecret = {
        id_instancia: 2,
        revelada: true,
        url: 'revealed-secret.png'
    };

    test('no renderiza nada si la prop "secret" es nula', () => {
        const { container } = render(<MySecretCard secret={null} />);
        expect(container.firstChild).toBeNull();
    });

    describe('Cuando el secreto está oculto', () => {
        test('renderiza la carta y aplica la clase "hidden"', () => {
            const { container } = render(<MySecretCard secret={hiddenSecret} />);

            // Verifica que el contenedor principal tiene la clase de estilo para ocultar
            expect(container.firstChild).toHaveClass(styles.hidden);

            // Verifica que el componente Card se renderiza
            expect(screen.getByTestId('mock-card')).toBeInTheDocument();
            expect(screen.getByTestId('mock-card')).toHaveTextContent('hidden-secret.png');
        });

        test('no muestra el ícono del ojo', () => {
            render(<MySecretCard secret={hiddenSecret} />);
            // El ícono (y su contenedor) no deberían existir en el DOM
            const overlay = screen.queryByRole('img', { hidden: true }); // Los SVGs a veces no tienen rol, buscamos de forma genérica
            expect(overlay).not.toBeInTheDocument();
        });
    });

    describe('Cuando el secreto está revelado', () => {
        test('renderiza la carta sin la clase "hidden"', () => {
            const { container } = render(<MySecretCard secret={revealedSecret} />);

            // El contenedor NO debe tener la clase para ocultar
            expect(container.firstChild).not.toHaveClass(styles.hidden);

            // El componente Card se renderiza
            expect(screen.getByTestId('mock-card')).toBeInTheDocument();
            expect(screen.getByTestId('mock-card')).toHaveTextContent('revealed-secret.png');
        });

        test('muestra el ícono del ojo', () => {
            render(<MySecretCard secret={revealedSecret} />);

            const overlay = screen.getByTestId('revealed-icon');

            expect(overlay).toBeInTheDocument();
            expect(overlay).toHaveClass(styles.revealedOverlay);
        });
    });
});