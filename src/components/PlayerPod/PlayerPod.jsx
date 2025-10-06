import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './PlayerPod.module.css';
import { cardService } from '@/services/cardService';
import Card from '@/components/Card/Card';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';

// --- SVG Icons (self-contained for ease of use) ---
const UserIcon = () => <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" stroke="white" strokeWidth="4" /><circle cx="50" cy="38" r="12" stroke="white" strokeWidth="4" /><path d="M25 85 C 35 65, 65 65, 75 85" stroke="white" strokeWidth="4" fill="none" /></svg>;
const EyeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" /></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" /></svg>;
const ArrowIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>;


const PlayerPod = ({ player, isCurrentTurn, roleEmoji }) => {
    const [allSets, setAllSets] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const visibleSetsCount = 3; // How many cards to show at once

    useEffect(() => {
        setAllSets(cardService.getRandomDetectives(7));
    }, []);

    const podClasses = `${styles.pod} ${isCurrentTurn ? styles.currentTurn : ''}`;

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(prev + 1, allSets.length - visibleSetsCount));
    };

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    const cardWidth = 80; // from .carouselCard width
    const cardGap = 5;    // from .setsTrack gap
    const trackOffset = currentIndex * (cardWidth + cardGap);

    const visibleSets = allSets.slice(currentIndex, currentIndex + visibleSetsCount);



    return (
        <div className={styles.podWrapper}>
            {/* --- Main Pod Info --- */}
            <div className={podClasses} data-testid="player-pod">
                {roleEmoji && <span className={styles.roleEmoji}>{roleEmoji}</span>}
                <div className={styles.topSection}>
                    <div className={styles.playerIdentifier}>
                        <div className={styles.playerIcon}><UserIcon /></div>
                        <span className={styles.playerName}>{player.nombre_jugador}</span>
                    </div>
                    <div className={styles.secretsInfo}>
                        <img src={secretCardBack} alt="Secret card back" className={styles.secretCardImage} />
                        <div className={styles.secretStats}>
                            <span><EyeIcon /> 0</span>
                            <span><LockIcon /> 3</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Sets Carousel --- */}
            {allSets.length > 0 && (
                <div className={styles.setsCarousel}>
                    {currentIndex > 0 && (
                        <button aria-label="Previous Set" className={`${styles.arrowButton} ${styles.left}`} onClick={handlePrev}>
                            <ArrowIcon />
                        </button>
                    )}

                    <div className={styles.setsScroller}>
                        <div className={styles.setsTrack}>
                            {visibleSets.map((card) => (
                                <div key={card.id} className={styles.carouselCard}>
                                    <Card imageName={card.url} subfolder="game-cards" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentIndex < allSets.length - visibleSetsCount && (
                        <button aria-label="Next Set" className={`${styles.arrowButton} ${styles.right}`} onClick={handleNext}>
                            <ArrowIcon />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

PlayerPod.propTypes = {
    player: PropTypes.shape({
        id_jugador: PropTypes.number.isRequired,
        nombre_jugador: PropTypes.string.isRequired,
    }).isRequired,
    isCurrentTurn: PropTypes.bool,
    roleEmoji: PropTypes.string,
};

export default PlayerPod;