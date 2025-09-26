import React from "react";
import { render, screen } from "@testing-library/react";
import GameListContainer from "@/containers/ListarPartida/GameListContainer.jsx";
import { vi, describe, it, expect } from "vitest";

// Mock del servicio API
vi.mock("@/services/apiService.js", () => ({
  apiService: {
    listGames: vi.fn(),
  },
}));

// Mock de GameList para no renderizar la UI real
vi.mock("@/components/GameList/GameList.jsx", () => ({
  default: ({ games }) => (
    <div data-testid="mock-game-list">
      {games.map(g => (
        <span key={g.id}>{g.name}</span>
      ))}
    </div>
  ),
}));

describe("GameListContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("llama al servicio y muestra las partidas transformadas", async () => {
   
    const mockData = [
      { id: 1, nombre: "Partida A", minJugadores: 2, maxJugadores: 4, cantJugadores: 1 },
      { id: 2, nombre: "Partida B", minJugadores: 2, maxJugadores: 5, cantJugadores: 3 },
    ];
    const { apiService } = await import("@/services/apiService.js");
    apiService.listGames.mockResolvedValue(mockData);

    render(<GameListContainer />);
    const list = await screen.findByTestId("mock-game-list");

    // Verifica que los nombres se pasaron correctamente
    expect(list.textContent).toContain("Partida A");
    expect(list.textContent).toContain("Partida B");

    // Verifica que se llamó al API
    expect(apiService.listGames).toHaveBeenCalledTimes(1);
  });
});

