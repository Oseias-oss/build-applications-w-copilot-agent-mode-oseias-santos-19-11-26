import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

type WorkoutsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; suggestions: WorkoutSuggestion[] };

const suggestionUserEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<WorkoutsState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(suggestionUserEmail)}`)
      .then(({ suggestions }) => {
        if (isMounted) setState({ status: 'success', suggestions });
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
        <h2 className="h4">Sugestões de treino</h2>
        <p>Receba recomendações de treino com base nos seus padrões de atividade.</p>
        {state.status === 'loading' && <p role="status">Carregando sugestões...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as sugestões de treino.</p>}
        {state.status === 'success' && state.suggestions.length === 0 && (
          <p role="status">Sem sugestões de treino disponíveis.</p>
        )}
        {state.status === 'success' && state.suggestions.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={`${suggestion.title}-${index}`}>
                <h3 className="h6 mb-1">{suggestion.title}</h3>
                {suggestion.focus && <p className="mb-1">Foco: {suggestion.focus}</p>}
                {suggestion.minutes !== undefined && <p className="mb-1">Duração: {suggestion.minutes} minutos</p>}
                {suggestion.difficulty && <p className="mb-1">Dificuldade: {suggestion.difficulty}</p>}
                {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
