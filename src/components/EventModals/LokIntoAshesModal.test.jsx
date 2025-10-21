import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LookIntoAshesModal from "@/components/EventModals/LookIntoAshesModal";
import '@testing-library/jest-dom';

describe("LookIntoAshesModal (UI)", () => {
  it("muestra todas las cartas cuando hay menos de 5", () => {
    const cards = [
      { instanceId: "c1", url: "1.png" },
      { instanceId: "c2", url: "2.png" },
      { instanceId: "c3", url: "3.png" },
    ];

    render(
      <LookIntoAshesModal
        isOpen={true}
        onClose={vi.fn()}
        discardCards={cards}
        selectedCard={null}
        onCardSelect={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Look Into The Ashes")).toBeInTheDocument();
    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBe(3);
  });


  it("permite seleccionar una carta y habilita el botón de confirmar", () => {
    const onSelect = vi.fn();
    const cards = [{ instanceId: "card1", url: "img.png" }];

    render(
      <LookIntoAshesModal
        isOpen={true}
        onClose={vi.fn()}
        discardCards={cards}
        selectedCard={null}
        onCardSelect={onSelect}
        onConfirm={vi.fn()}
      />
    );

    const img = screen.getByRole("img");
    fireEvent.click(img);
    expect(onSelect).toHaveBeenCalledWith("card1");
  });

  it("muestra mensaje cuando no hay cartas en el mazo de descarte", () => {
    render(
      <LookIntoAshesModal
        isOpen={true}
        onClose={vi.fn()}
        discardCards={[]}
        selectedCard={null}
        onCardSelect={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByText("No hay cartas en el mazo de descarte")
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: "Elegir Carta" });
    expect(confirmButton).toBeDisabled();
  });
});
