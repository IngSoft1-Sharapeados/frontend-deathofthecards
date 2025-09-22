import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import GameCreateForm from "./GameCreateForm.jsx"; // ajustá la ruta según tu proyecto
// Configura los matchers de jest-dom
expect.extend(matchers);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GameCreateForm", () => {
  const mockForm = {
    nombrePartida: "",
    nombreJugador: "",
    fechaNacimiento: "",
    minJugadores: "",
    maxJugadores: "",
  };
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockMessage = "";

  it("Renderiza todos los inputs y el botón", () => {
    render(
      <GameCreateForm
        form={mockForm}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        errors={{}}
        message={mockMessage}
      />
    );

    expect(screen.getByLabelText("Nombre de la partida")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del jugador")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeInTheDocument();
    expect(screen.getByLabelText("Mínimos Jugadores")).toBeInTheDocument();
    expect(screen.getByLabelText("Máximos Jugadores")).toBeInTheDocument();
    expect(screen.getByText("Crear partida")).toBeInTheDocument();
  });

  it("Llama onChange al escribir en un input", () => {
    render(
      <GameCreateForm
        form={mockForm}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        errors={{}}
        message={mockMessage}
      />
    );

    const input = screen.getByLabelText("Nombre de la partida");
    fireEvent.change(input, { target: { value: "Mi partida" } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("Llama onSubmit al enviar el formulario", () => {
    render(
      <GameCreateForm
        form={mockForm}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        errors={{}}
        message={mockMessage}
      />
    );

    const button = screen.getByText("Crear partida");
    fireEvent.click(button);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("Muestra errores debajo de los inputs", () => {
    const errors = {
      nombrePartida: "Requerido",
      nombreJugador: "Requerido",
      minJugadores: "Mínimo 2",
      maxJugadores: "Máximo 6",
    };

    render(
      <GameCreateForm
        form={mockForm}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        errors={errors}
        message={mockMessage}
      />
    );

    const requeridos= screen.getAllByText("Requerido");
    expect(requeridos).toHaveLength(2);
    expect(screen.getByText("Mínimo 2")).toBeInTheDocument();
    expect(screen.getByText("Máximo 6")).toBeInTheDocument();
  });

  it("Muestra el mensaje general enviado por props", () => {
    render(
      <GameCreateForm
        form={mockForm}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        errors={{}}
        message="Partida creada con éxito"
      />
    );

    expect(screen.getByText("Partida creada con éxito")).toBeInTheDocument();
  });
});
