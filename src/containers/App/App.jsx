import React from 'react';
import { Routes, Route, useParams } from "react-router-dom";
import './App.css';
import HomePage from '@/pages/HomePage/HomePage.jsx';
import GameLobbyPage from "@/pages/gameLobby.jsx";
import GamePage from "@/pages/GamePage/GamePage.jsx";

function App() {

  return (
    <main className="App-container">
      <Routes>
        {/* Ruta Home */}
        <Route
          path="/"
          element={
            <>
              <GamePage  />
            </>
          }
        />

        {/* Ruta página del juego */}
        <Route path="/partidas/:id" element={<GameLobbyPage />} />
      </Routes>
    </main>
  );
}



export default App;

