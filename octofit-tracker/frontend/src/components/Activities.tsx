import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

type ActivityState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; activities: Activity[] };

const activityLabels: Record<string, string> = {
  run: 'Corrida',
  cycle: 'Ciclismo',
  strength: 'Treino de força',
  walk: 'Caminhada',
};

export default function Activities() {
  const [state, setState] = useState<ActivityState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (isMounted) setState({ status: 'success', activities });
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
        <h2 className="h4">Atividades</h2>
        <p>Acompanhe os minutos de atividade e os pontos das pessoas participantes.</p>
        {state.status === 'loading' && <p role="status">Carregando atividades...</p>}
        {state.status === 'error' && <p role="alert">Não foi possível carregar as atividades.</p>}
        {state.status === 'success' && state.activities.length === 0 && (
          <p role="status">Sem atividades registradas.</p>
        )}
        {state.status === 'success' && state.activities.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.activities.map((activity, index) => (
              <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${activity.minutes}-${index}`}>
                <h3 className="h6 mb-1">{activityLabels[activity.type] ?? activity.type}</h3>
                <p className="mb-0">{activity.minutes} minutos · {activity.points} pontos</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
