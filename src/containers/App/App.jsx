import { useState } from 'react';
import viteLogo from '../../../public/vite.svg'; // Ajusta la ruta si es necesario
import UserForm from '../../components/UserForm.jsx'; // Asumí una ruta, ajústala a la tuya
import './App.css';

function App() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleFormSubmit = (formData) => {
    console.log('Datos recibidos del formulario:', formData);
    setUserData(formData);
    setIsFormVisible(false); // Cierra el formulario tras el envío exitoso
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
  };
  
  const handleOpenForm = () => {
    setIsFormVisible(true);
  };

  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h1>Vite + React (Ejemplo)</h1>
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={handleOpenForm}
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem' }}
        >
          Ir al Formulario de Usuario
        </button>
        <p style={{ marginTop: '1rem' }}>
          Haz clic en el botón para cargar el formulario.
        </p>
      </div>
      <p style={{ marginTop: '2rem', color: '#6b7280' }}>
        Click on the Vite and React logos to learn more (Texto de ejemplo)
      </p>

      {isFormVisible && (
        <UserForm 
          onSubmit={handleFormSubmit} 
          onClose={handleCloseForm} 
        />
      )}

    </main>
  );
}

export default App;