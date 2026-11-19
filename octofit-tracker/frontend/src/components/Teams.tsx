import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: string[];
};

type TeamsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<TeamsState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (isMounted) setState({ status: 'success', teams });
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
        <h2 className="h4">Equipes</h2>
        <p>Gerencie equipes e integrantes.</p>
        {state.status === 'loading' && <p role="status">Carregando equipes...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as equipes.</p>}
        {state.status === 'success' && state.teams.length === 0 && (
          <p role="status">Sem equipes cadastradas.</p>
        )}
        {state.status === 'success' && state.teams.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <h3 className="h6 mb-1">{team.name}</h3>
                {team.mascot && <p className="mb-1">Mascote: {team.mascot}</p>}
                {team.members && team.members.length > 0 && (
                  <p className="mb-0">Integrantes: {team.members.join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
