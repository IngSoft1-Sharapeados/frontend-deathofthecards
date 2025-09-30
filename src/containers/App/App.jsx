import React from 'react';
import { Routes, Route, useParams } from "react-router-dom";
import './App.css';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import GameLobbyPage from "@/pages/gameLobby/gameLobby.jsx";
import GamePage from '@/pages/GamePage/GamePage.jsx';
function App() {

  return (
    <main className="App-container">
      <Routes>
        {/* Ruta Home */}
        <Route
          path="/"
          element={
            <>
              <HomePage  />
            </>
          }
        />

        {/* Ruta página del juego */}
        <Route path="/partidas/:id" element={<GameLobbyPage />} />
        <Route path="/partidas/:id/juego" element={<GamePage />} />
      </Routes>
    </main>
  );
}



export default App;

