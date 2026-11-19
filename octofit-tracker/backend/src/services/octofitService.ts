import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Dados da atividade inválidos'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Dados da atividade inválidos'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Pessoa usuária ou equipe não encontrada'), { status: 400 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Dados da equipe inválidos'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    (members !== undefined && !Array.isArray(members))
  ) {
    throw Object.assign(new Error('Dados da equipe inválidos'), { status: 400 });
  }

  const memberIds = [...new Set((members ?? []) as unknown[])];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId))) {
    throw Object.assign(new Error('Integrantes da equipe inválidos'), { status: 400 });
  }

  const users = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select('_id team').lean()
    : [];
  if (users.length !== memberIds.length) {
    throw Object.assign(new Error('Pessoa usuária não encontrada'), { status: 400 });
  }

  const previousTeamIds = users.map(({ team }) => team).filter(Boolean);
  if (previousTeamIds.length) {
    await Team.updateMany(
      { _id: { $in: previousTeamIds } },
      { $pull: { members: { $in: memberIds } } },
    );
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const totalPointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalPointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('Pessoa usuária não encontrada'), { status: 404 });
  }

  const activities = await Activity.find({ user: user._id }).lean();
  const focusByActivityType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'endurance',
    strength: 'strength',
  };
  const focusCounts = new Map<string, number>();
  for (const activity of activities) {
    const focus = focusByActivityType[activity.type] ?? user.fitnessGoal;
    focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
  }

  const reasonByFocus: Record<string, string> = {
    endurance: 'Recomendado com base nas suas atividades de corrida e resistência.',
    strength: 'Recomendado com base nas suas atividades de força.',
    mobility: 'Recomendado com base na sua meta de mobilidade.',
  };
  const workouts = await Workout.find().lean();
  return workouts
    .sort((left, right) => {
      const leftScore = (focusCounts.get(left.focus) ?? 0) + (left.focus === user.fitnessGoal ? 0.25 : 0);
      const rightScore = (focusCounts.get(right.focus) ?? 0) + (right.focus === user.fitnessGoal ? 0.25 : 0);
      return rightScore - leftScore || (left.title ?? '').localeCompare(right.title ?? '');
    })
    .map((workout) => ({
      ...workout,
      reason: reasonByFocus[workout.focus] ?? 'Recomendado com base no seu padrão de atividades.',
    }));
}

export { User };
