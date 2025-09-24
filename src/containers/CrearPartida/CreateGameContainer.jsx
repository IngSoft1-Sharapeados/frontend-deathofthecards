import { useState } from "react";
import { apiService } from "@/services/apiService";
import GameCreateForm from "@/components/CrearPartida/GameCreateForm";
import { useNavigate } from "react-router-dom";
export default function GameCreateFormContainer() {
  const [form, setForm] = useState({
    nombrePartida: "",
    nombreJugador: "",
    fechaNacimiento: "",
    minJugadores: "",
    maxJugadores: "",
  });
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const validate = () => {
    const newErrors = {};

    if (!form.nombrePartida) newErrors.nombrePartida = "Requerido";
    if (!form.nombreJugador) newErrors.nombreJugador = "Requerido";
    if (!form.fechaNacimiento) newErrors.fechaNacimiento = "Requerido";

    const min = parseInt(form.minJugadores, 10);
    const max = parseInt(form.maxJugadores, 10);

    if (isNaN(min) || min < 2) newErrors.minJugadores = "Mínimos Jugadores debe ser mayor igual que 2";
    if (isNaN(max) || max > 6) newErrors.maxJugadores = "Máximos Jugadores debe ser menor igual que 6";
    if (!newErrors.minJugadores && !newErrors.maxJugadores && min > max) {
      newErrors.maxJugadores = "Debe ser ≥ mínimo";
    }
    console.log("Errores detectados:", newErrors, "¿Válido?", Object.keys(newErrors).length === 0);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      console.log("Enviando al backend:", {
        "nombre-partida": form.nombrePartida,
        "nombre-jugador": form.nombreJugador,
        "dia-nacimiento": form.fechaNacimiento,
        "min-jugadores": parseInt(form.minJugadores), 
        "max-jugadores": parseInt(form.maxJugadores),
      });
      //Aca le mandamos los datos al Backend 
      const result = await apiService.createGame({
        "nombre-partida": form.nombrePartida,
        "nombre-jugador": form.nombreJugador,
        "dia-nacimiento": form.fechaNacimiento,
        "min-jugadores": parseInt(form.minJugadores), 
        "max-jugadores": parseInt(form.maxJugadores),
      });
      
      setMessage(`Partida creada con id: ${result.partida_id}`);
      // Redirigir a la nueva partida
      if (result["partida_id"]) {
       navigate(`/partidas/${result.partida_id}`);
      }
    } catch {
      setMessage(" Error al crear partida");
    }
  };

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)}>
        Crear partida
      </button>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">completar</h2>
          <button
            onClick={() => setShowForm(false)}
            className="modal-close-btn"
            aria-label="Cerrar modal"
            type="button"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <GameCreateForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          message={message}
          errors={errors}
        />
      </div>
    </div>
  );
}
