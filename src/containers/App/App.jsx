import React from 'react';
import './App.css';
import HomePage from '@/pages/HomePage.jsx';
import GameCreateFormContainer from '@/containers/CrearPartida/CreateGameContainer';
function App() {
  return (
    <main className="App-container">
      <HomePage />
      <GameCreateFormContainer />
    </main>
  );
}



export default App;

