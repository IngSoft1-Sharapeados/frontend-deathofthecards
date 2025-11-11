import React from "react";
import "./DeadCardFollyModal.css";

const DeadCardFollyModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalHeader">
          <h2>Elegí una dirección para jugar dead card folly</h2>
        </div>

        <div className="directionButtons">
          <button 
            className="directionButton leftButton" 
            onClick={() => onConfirm("izquierda")}
          >
            Izquierda
          </button>
          <button
            className="directionButton rightButton" 
            onClick={() => onConfirm("derecha")}
          >
            Derecha
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeadCardFollyModal;