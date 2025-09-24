import React from 'react';
import { Routes, Route, useParams } from "react-router-dom";
import './App.css';
import HomePage from '@/pages/HomePage.jsx';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';

function App() {

    // borrar cuando PartidaPage real exista
  const PartidaPage = () => {
    const { id } = useParams();
    return <>lobby falso: {id}</>;
  };

  return (
    <main className="App-container">
      <Routes>
        {/* Ruta Home */}
        <Route
          path="/"
          element={
            <>
              <HomePage />
              <GameCreateFormContainer />
            </>
          }
        />

        {/* Ruta página del juego */}
        <Route path="/partidas/:id" element={<PartidaPage />} />
      </Routes>
    </main>
  );
}



export default App;

