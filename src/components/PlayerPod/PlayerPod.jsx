import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './PlayerPod.module.css';
import { cardService } from '@/services/cardService';
import Card from '@/components/Card/Card';
import secretCardBack from '@/assets/images/cards/misc/05-secret_back.png';

// --- SVG Icons (self-contained for ease of use) ---
const UserIcon = () => <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" stroke="white" strokeWidth="4" /><circle cx="50" cy="38" r="12" stroke="white" strokeWidth="4" /><path d="M25 85 C 35 65, 65 65, 75 85" stroke="white" strokeWidth="4" fill="none" /></svg>;
const EyeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" /></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" /></svg>;
const ArrowIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>;


const PlayerPod = ({ player, isCurrentTurn, roleEmoji, onSecretsClick, playerSecrets, sets = [], isDisgraced }) => {

    const [allSets, setAllSets] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [secretIndex, setSecretIndex] = useState(0);
    const visibleSetsCount = 3; // Number of cards to show at once
    const visibleSecretsCount = 3; // Number of secrets to show at once
    const trackRef = useRef(null);

    useEffect(() => {
        // Map provided set representations to real images
        const mapped = (sets || []).map((s) => cardService.getPlayingHand([{ id: s.id }])[0]);
        setAllSets(mapped);
    }, [sets]);

    const podClasses = `${styles.pod} ${isCurrentTurn ? styles.currentTurn : ''}`;
    const totalCards = allSets.length;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < totalCards - visibleSetsCount;

    const revealedCount = playerSecrets?.revealed ?? 0;
    const hiddenCount = playerSecrets?.hidden ?? 3;
    const totalSecrets = revealedCount + hiddenCount;
    const canGoPrevSecret = secretIndex > 0;
    const canGoNextSecret = secretIndex < totalSecrets - visibleSecretsCount;

    let statusIcon = null;
    if (isDisgraced) {
        statusIcon = '🤡';
    } else if (roleEmoji) {
        statusIcon = roleEmoji;
    }


    const handleNext = (e) => {
        e.stopPropagation();
        if (canGoNext) {
            setCurrentIndex(prev => Math.min(prev + 1, totalCards - visibleSetsCount));
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (canGoPrev) {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
        }
    };

    const handleNextSecret = (e) => {
        e.stopPropagation();
        if (canGoNextSecret) {
            setSecretIndex(prev => Math.min(prev + 1, totalSecrets - visibleSecretsCount));
        }
    };

    const handlePrevSecret = (e) => {
        e.stopPropagation();
        if (canGoPrevSecret) {
            setSecretIndex(prev => Math.max(prev - 1, 0));
        }
    };

    // Calculate the visible cards with some overlap
    const visibleSets = allSets.slice(currentIndex, currentIndex + visibleSetsCount);

    // Generate secret cards array for carousel
    const secretCardsArray = [];
    for (let i = 0; i < totalSecrets; i++) {
        secretCardsArray.push({
            id: i,
            type: i < revealedCount ? 'revealed' : 'hidden'
        });
    }
    const visibleSecrets = secretCardsArray.slice(secretIndex, secretIndex + visibleSecretsCount);

    return (
        <div className={styles.podWrapper}>
            {/* Detective Cards Carousel */}
            {allSets.length > 0 && (
                <div className={styles.setsCarousel}>
                    <div className={styles.setsScroller}>
                        <div className={styles.arrowButtonContainer}>
                            <button
                                aria-label="Previous detective"
                                className={`${styles.arrowButton} ${styles.left}`}
                                onClick={handlePrev}
                                disabled={!canGoPrev}
                            >
                                <ArrowIcon />
                            </button>
                        </div>

                        <div className={styles.setsTrack} ref={trackRef}>

                            {visibleSets.map((card, index) => (
                                <div key={`${card.id}-${index}`} className={styles.carouselCard}>
                                    <Card
                                        imageName={card.url}
                                        subfolder="game-cards"
                                        alt={`Detective card ${index + 1}`}
                                    />
                                </div>
                            ))}

                        </div>

                        <div className={styles.arrowButtonContainer}>
                            <button
                                aria-label="Next detective"
                                className={`${styles.arrowButton} ${styles.right}`}
                                onClick={handleNext}
                                disabled={!canGoNext}
                            >
                                <ArrowIcon />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={podClasses} data-testid="player-pod">
                {statusIcon && <span className={styles.statusIcon}>{statusIcon}</span>}
                <div className={styles.topSection}>
                    <div className={styles.playerIdentifier}>
                        <div className={styles.playerIcon}><UserIcon /></div>
                        <span className={styles.playerName}>{player.nombre_jugador}</span>
                    </div>
                    <div className={styles.secretsInfo} onClick={() => onSecretsClick(player)}>
                        {totalSecrets <= 3 ? (
                            // Original display for 3 or fewer secrets
                            <>
                                <img src={secretCardBack} alt="Secret card back" className={styles.secretCardImage} />
                                <div className={styles.secretStats}>
                                    <span><EyeIcon /> {revealedCount}</span>
                                    <span><LockIcon /> {hiddenCount}</span>
                                </div>
                            </>
                        ) : (
                            // Carousel display for more than 3 secrets
                            <div className={styles.secretsCarousel}>
                                <div className={styles.secretsScroller}>
                                    {canGoPrevSecret && (
                                        <button
                                            aria-label="Previous secret"
                                            className={`${styles.secretArrowButton} ${styles.left}`}
                                            onClick={handlePrevSecret}
                                        >
                                            <ArrowIcon />
                                        </button>
                                    )}
                                    
                                    <div className={styles.secretsTrack}>
                                        {visibleSecrets.map((secret, index) => (
                                            <div key={`secret-${secret.id}`} className={styles.miniSecretCard}>
                                                <img 
                                                    src={secretCardBack} 
                                                    alt={secret.type === 'revealed' ? 'Secreto revelado' : 'Secreto oculto'} 
                                                    className={styles.miniSecretImage}
                                                />
                                                <div className={styles.miniSecretIcon}>
                                                    {secret.type === 'revealed' ? <EyeIcon /> : <LockIcon />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {canGoNextSecret && (
                                        <button
                                            aria-label="Next secret"
                                            className={`${styles.secretArrowButton} ${styles.right}`}
                                            onClick={handleNextSecret}
                                        >
                                            <ArrowIcon />
                                        </button>
                                    )}
                                </div>
                                <div className={styles.secretStats}>
                                    <span><EyeIcon /> {revealedCount}</span>
                                    <span><LockIcon /> {hiddenCount}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
    sets: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number.isRequired })),
};

PlayerPod.defaultProps = {
    isCurrentTurn: false,
    roleEmoji: undefined,
    sets: [],
    onSecretsClick: () => { },
    playerSecrets: undefined,
};

export default PlayerPod;