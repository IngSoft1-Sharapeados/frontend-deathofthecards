import { render, screen } from '@testing-library/react';
import Deck from './Deck';
import '@testing-library/jest-dom';
describe('Deck component', () => {
  it('renders without crashing', () => {
    render(<Deck count={10} />);
    const images = screen.getAllByRole('img', { name: /Mazo de cartas/i });
    expect(images.length).toBeGreaterThan(0); //  que haya al menos una carta
  });

  it('shows the correct counter', () => {
    const count = 12;
    render(<Deck count={count} />);
    expect(screen.getByText(count.toString())).toBeInTheDocument();
  });
});