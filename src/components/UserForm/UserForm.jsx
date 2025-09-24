import React, { useState } from 'react';
import './UserForm.css'; 

// --- Componente del Formulario ---
const UserForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    birthday: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio.';
    }
    if (!formData.birthday) {
      newErrors.birthday = 'La fecha de cumpleaños es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
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
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username ? 'input-error' : ''}`}
                  placeholder=" " 
                />
                <label htmlFor="username" className="form-label">Nombre de Usuario</label>
                {errors.username && <p className="error-message">{errors.username}</p>}
              </div>
              <div className="form-group">
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className={`form-input ${errors.birthday ? 'input-error' : ''}`}
                  placeholder=" "
                />
                <label htmlFor="birthday" className="form-label">Fecha de Cumpleaños</label>
                {errors.birthday && <p className="error-message">{errors.birthday}</p>}
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