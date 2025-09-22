import { useState } from "react";
import { apiService } from "@/services/apiService";
import GameCreateForm from "@/components/GameCreateForm";
// import { useNavigate } from "react-router-dom";
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
    console.log("Errores detectados:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await apiService.createGame({
        "nombre-partida": form.nombrePartida,
        "nombre-jugador": form.nombreJugador,
        "dia-nacimiento": form.fechaNacimiento,
      });
      setMessage(`Partida creada con id: ${result.partida_id}`);
      /*if (result["id-partida"]) {
        navigate(`/partidas/${result["id-partida"]}`);
      }*/
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
    <GameCreateForm
      form={form}
      onChange={handleChange}
      onSubmit={handleSubmit}
      message={message}
      errors={errors} 
    />
  );
}
