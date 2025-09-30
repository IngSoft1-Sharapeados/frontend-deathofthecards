import "@/components/UI/BasicForm.css";
import FormInput from "@/components/UI/FormInput";

export default function GameCreateForm({ form, onChange, onSubmit, message, errors }) {
  return (
    <form className="form-container" onSubmit={onSubmit}>
      
      <FormInput
        label="Nombre de la partida"
        name="nombrePartida"
        value={form.nombrePartida}
        onChange={onChange}
        error={errors?.nombrePartida}
      />

      <FormInput
        label="Nombre del jugador"
        name="nombreJugador"
        value={form.nombreJugador}
        onChange={onChange}
        error={errors?.nombreJugador}
      />

      <FormInput
        label="Fecha de nacimiento"
        name="fechaNacimiento"
        type="date"
        value={form.fechaNacimiento}
        onChange={onChange}
        error={errors?.fechaNacimiento}
      />

      <FormInput
        label="Mínimos Jugadores"
        name="minJugadores"
        type="number"
        value={form.minJugadores}
        onChange={onChange}
        error={errors?.minJugadores}
      />

      <FormInput
        label="Máximos Jugadores"
        name="maxJugadores"
        type="number"
        value={form.maxJugadores}
        onChange={onChange}
        error={errors?.maxJugadores}
      />

      <div className="buttons-container">
        <button type="submit">Crear partida</button>
        <span>{message}</span>
      </div>
    </form>
  );
}