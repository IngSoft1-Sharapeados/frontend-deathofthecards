import React, { useState } from 'react';
import '@/components/UI/BasicForm.css';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/apiService';
// --- Componente del Formulario ---
const UserForm = ({ gameId, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreJugador: '',
    fechaNacimiento: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreJugador.trim()) {
      newErrors.nombreJugador = 'El nombre de usuario es obligatorio.';
    }
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de cumpleaños es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await apiService.joinGame(gameId, formData)
        sessionStorage.setItem('playerId', response.id_jugador);
        onClose();
        navigate(`/partidas/${gameId}`);
      } catch (error) {
        console.error("Error al unirse a la partida:", error);
        alert(`Error al unirse a la partida: ${error.message || "No se pudo unir a la partida"} `);
      }

    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };


  return (
    <>
      <div className="modal-overlay">
        <div className="modal-card">

          <div className="modal-header">
            <h2 className="modal-title">Completa tu información</h2>
            <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-body">
              <div className="form-group">
                <input
                  type="text"
                  id="nombreJugador"
                  name="nombreJugador"
                  value={formData.nombreJugador}
                  onChange={handleChange}
                  className={`form-input ${errors.nombreJugador ? 'input-error' : ''}`}
                  placeholder=" "
                />
                <label htmlFor="nombreJugador" className="form-label">Nombre de Usuario</label>
                {errors.nombreJugador && <p className="error-message">{errors.nombreJugador}</p>}
              </div>
              <div className="form-group">
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className={`form-input ${errors.fechaNacimiento ? 'input-error' : ''}`}
                  placeholder=" "
                />
                <label htmlFor="fechaNacimiento" className="form-label">Fecha de Cumpleaños</label>
                {errors.fechaNacimiento && <p className="error-message">{errors.fechaNacimiento}</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserForm;