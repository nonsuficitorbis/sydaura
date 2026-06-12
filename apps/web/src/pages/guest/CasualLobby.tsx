import React, { useState } from 'react';
import { useGameSocket } from '../../hooks/useGameSocket';
import { TicTacToe } from '../../components/games/TicTacToe';
import { ConnectFour } from '../../components/games/ConnectFour';
import { DotsAndBoxes } from '../../components/games/DotsAndBoxes';
import { Battleship } from '../../components/games/Battleship';
import { WordHunt } from '../../components/games/WordHunt';

interface CasualLobbyProps {
  locationId: string;
  onBack: () => void;
}

export const CasualLobby: React.FC<CasualLobbyProps> = ({ locationId, onBack }) => {
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);

  const {
    lobbyRoster,
    myGuestId,
    incomingChallenge,
    activeGame,
    battleshipState,
    wordHuntState,
    joinCasual,
    sendChallenge,
    respondToChallenge,
    makeTicTacToeMove,
    makeConnect4Move,
    makeDotsAndBoxesMove,
    placeBattleshipShips,
    strikeBattleshipCoordinate,
    submitWordHuntWord,
    closeGame,
  } = useGameSocket();

  const handleJoin = () => {
    if (!nickname.trim()) return;
    joinCasual(locationId, nickname.trim());
    setJoined(true);
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'CONNECT_4': return 'Connect 4';
      case 'DOTS_AND_BOXES': return 'Dots & Boxes';
      case 'BATTLESHIP': return 'Battleship';
      case 'WORD_HUNT': return 'Word Hunt';
      default: return 'Tic-Tac-Toe';
    }
  };

  return (
    <div className="glass-card page-enter" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      
      {/* Back button */}
      <button 
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        ← Back to Hub
      </button>

      {!joined ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="text-gradient">Casual Matchmaker</h2>
          <p className="text-secondary">
            Enter a nickname to enter the lounge and challenge other guests at the venue.
          </p>
          <input
            type="text"
            className="input-premium"
            placeholder="Enter nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={15}
          />
          <button 
            className="btn-primary" 
            onClick={handleJoin}
            disabled={!nickname.trim()}
          >
            Enter Casual Lobby
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="text-gradient">Lounge Lobby</h2>
            <p className="text-secondary">Find a player to challenge to a game!</p>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              Online Players ({lobbyRoster.length}):
            </h4>
            
            {lobbyRoster.length <= 1 ? (
              <p className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                You are currently the only player in the casual lobby. Open another tab to challenge someone!
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                {lobbyRoster.map((p, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      background: 'var(--bg-surface-elevated)', 
                      border: '1px solid var(--border-subtle)', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '12px', 
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <span>👤 {p.nickname} {p.guestId === myGuestId && '(You)'}</span>
                    {p.guestId !== myGuestId && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => sendChallenge(p.guestId, 'TIC_TAC_TOE')}
                        >
                          Tic-Tac-Toe ❌
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => sendChallenge(p.guestId, 'CONNECT_4')}
                        >
                          Connect 4 🔴
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => sendChallenge(p.guestId, 'DOTS_AND_BOXES')}
                        >
                          Dots & Boxes ⚄
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => sendChallenge(p.guestId, 'BATTLESHIP')}
                        >
                          Battleship 🚢
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => sendChallenge(p.guestId, 'WORD_HUNT')}
                        >
                          Word Hunt 🔠
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {incomingChallenge && (
            <div style={{
              background: 'rgba(9, 121, 105, 0.15)',
              border: '1px solid var(--accent-primary)',
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center',
              marginTop: '1rem'
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                ⚔️ {incomingChallenge.challengerNickname} challenged you to {getGameName(incomingChallenge.gameType)}!
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => respondToChallenge(incomingChallenge.challengerId, true, incomingChallenge.gameType)}>
                  Accept
                </button>
                <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: '#3a0000', color: '#ffb3b3' }} onClick={() => respondToChallenge(incomingChallenge.challengerId, false, incomingChallenge.gameType)}>
                  Decline
                </button>
              </div>
            </div>
          )}

          {activeGame && activeGame.gameType === 'CONNECT_4' && (
            <ConnectFour
              opponentNickname={activeGame.opponentNickname}
              symbol={activeGame.symbol as 'R' | 'Y'}
              myTurn={activeGame.myTurn}
              board={activeGame.board}
              gameOver={activeGame.gameOver}
              onDrop={(col) => makeConnect4Move(activeGame.gameRoomId, col)}
              onClose={closeGame}
            />
          )}

          {activeGame && activeGame.gameType === 'DOTS_AND_BOXES' && (
            <DotsAndBoxes
              opponentNickname={activeGame.opponentNickname}
              symbol={activeGame.symbol as 'R' | 'Y'}
              myTurn={activeGame.myTurn}
              board={activeGame.board}
              gameOver={activeGame.gameOver}
              onMove={(lineIdx) => makeDotsAndBoxesMove(activeGame.gameRoomId, lineIdx)}
              onClose={closeGame}
            />
          )}

          {activeGame && activeGame.gameType === 'BATTLESHIP' && (
            <Battleship
              opponentNickname={activeGame.opponentNickname}
              symbol={activeGame.symbol}
              myTurn={activeGame.myTurn}
              board={activeGame.board}
              gameOver={activeGame.gameOver}
              battleshipState={battleshipState}
              myGuestId={myGuestId}
              isPlayer1={activeGame.isPlayer1}
              onPlaceShips={(ships) => placeBattleshipShips(activeGame.gameRoomId, ships)}
              onStrike={(idx) => strikeBattleshipCoordinate(activeGame.gameRoomId, idx)}
              onClose={closeGame}
            />
          )}

          {activeGame && activeGame.gameType === 'WORD_HUNT' && (
            <WordHunt
              opponentNickname={activeGame.opponentNickname}
              board={activeGame.board}
              gameOver={activeGame.gameOver}
              wordHuntState={wordHuntState}
              isPlayer1={activeGame.isPlayer1}
              myGuestId={myGuestId}
              onSubmitWord={(word) => submitWordHuntWord(activeGame.gameRoomId, word)}
              onClose={closeGame}
            />
          )}

          {activeGame && activeGame.gameType === 'TIC_TAC_TOE' && (
            <TicTacToe
              opponentNickname={activeGame.opponentNickname}
              symbol={activeGame.symbol as 'X' | 'O'}
              myTurn={activeGame.myTurn}
              board={activeGame.board}
              gameOver={activeGame.gameOver}
              onMove={(index) => makeTicTacToeMove(activeGame.gameRoomId, index)}
              onClose={closeGame}
            />
          )}

        </div>
      )}

    </div>
  );
};
