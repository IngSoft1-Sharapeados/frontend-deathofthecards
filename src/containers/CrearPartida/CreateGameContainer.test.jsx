import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GameCreateFormContainer from "./CreateGameContainer";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// Mock del servicio API
vi.mock("@/services/apiService", () => ({
  apiService: {
    createGame: vi.fn().mockResolvedValue({ partida_id: 123 }),
  },
}));

describe("GameCreateFormContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra solo el botón al inicio", () => {
    render(<GameCreateFormContainer />);
    expect(screen.getByText("Crear partida")).toBeInTheDocument();
    // No debe haber inputs
    expect(screen.queryByLabelText("Nombre de la partida")).not.toBeInTheDocument();
  });

  it("muestra el formulario al hacer click en el botón", () => {
    render(<GameCreateFormContainer />);
    fireEvent.click(screen.getByText("Crear partida"));
    expect(screen.getByLabelText("Nombre de la partida")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del jugador")).toBeInTheDocument();
  });

  it("valida los campos y muestra errores si están vacíos", async () => {
    render(<GameCreateFormContainer />);
    fireEvent.click(screen.getByText("Crear partida"));
    fireEvent.click(screen.getByText("Crear partida")); // submit

    expect(await screen.findAllByText("Requerido")).toHaveLength(3); // nombrePartida, nombreJugador, fechaNacimiento
    expect(screen.getByText(/Mínimos Jugadores debe ser mayor igual que 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Máximos Jugadores debe ser menor igual que 6/i)).toBeInTheDocument();
  });

  it("envía el formulario correctamente si los datos son válidos", async () => {
    const { apiService } = await import("@/services/apiService");
    render(<GameCreateFormContainer />);
    fireEvent.click(screen.getByText("Crear partida"));

    fireEvent.change(screen.getByLabelText("Nombre de la partida"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Nombre del jugador"), { target: { value: "Jugador" } });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "2000-01-01" } });
    fireEvent.change(screen.getByLabelText("Mínimos Jugadores"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Máximos Jugadores"), { target: { value: "4" } });

    fireEvent.click(screen.getByText("Crear partida"));

    await waitFor(() => {
      expect(apiService.createGame).toHaveBeenCalled();
      expect(screen.getByText(/Partida creada con id: 123/)).toBeInTheDocument();
    });
  });
});