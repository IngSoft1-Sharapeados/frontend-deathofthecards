import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DeadCardFollyModal from "@/components/EventModals/DeadCardFolly/DeadCardFollyModal";
import "@testing-library/jest-dom";
describe("DeadCardFollyModal", () => {
  afterEach(() => cleanup());

  it("no se renderiza cuando isOpen es false", () => {
    render(<DeadCardFollyModal isOpen={false} onClose={() => {}} onConfirm={() => {}} />);
    // El modal no debería existir
    expect(screen.queryByText(/elegí una dirección/i)).toBeNull();
  });

  it("se renderiza correctamente cuando isOpen es true", () => {
    render(<DeadCardFollyModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText(/elegí una dirección/i)).toBeInTheDocument();
    expect(screen.getByText(/izquierda/i)).toBeInTheDocument();
    expect(screen.getByText(/derecha/i)).toBeInTheDocument();
  });

  it("llama a onConfirm con 'izquierda' al hacer clic en el botón correspondiente", () => {
    const onConfirm = vi.fn();
    render(<DeadCardFollyModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);

    const leftButton = screen.getByText(/izquierda/i);
    fireEvent.click(leftButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("izquierda");
  });

  it("llama a onConfirm con 'derecha' al hacer clic en el botón correspondiente", () => {
    const onConfirm = vi.fn();
    render(<DeadCardFollyModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);

    const rightButton = screen.getByText(/derecha/i);
    fireEvent.click(rightButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("derecha");
  });
});
