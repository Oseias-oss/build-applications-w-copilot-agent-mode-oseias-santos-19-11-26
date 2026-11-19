import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (isMounted) setState({ status: 'success', leaderboard });
      })
      .catch(() => {
        if (isMounted) setState({ status: 'error' });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Placar</h2>
        <p>Compare a pontuação total das equipes.</p>
        {state.status === 'loading' && <p role="status">Carregando placar...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar o placar.</p>}
        {state.status === 'success' && state.leaderboard.length === 0 && (
          <p role="status">Sem pontuação no placar.</p>
        )}
        {state.status === 'success' && state.leaderboard.length > 0 && (
          <ol className="list-group list-group-flush">
            {state.leaderboard.map((entry) => (
              <li className="list-group-item px-0" key={entry.teamName}>
                <h3 className="h6 mb-1">{entry.rank}. {entry.teamName}</h3>
                <p className="mb-0">{entry.totalPoints} pontos</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
