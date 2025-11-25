import { prisma } from '../lib/prisma';
import { parseWorkoutPlan } from '../lib/workout-parser';
import { startOfDay, endOfDay } from 'date-fns';

const DRY = process.argv.includes('--dry') || process.env.DRY_RUN === '1';

async function main() {
  console.log(`${DRY ? '[DRY RUN] ' : ''}Reparsing AI plans and updating workoutPlan entries...`);

  const aiPlans = await prisma.aIPlan.findMany();

  for (const ai of aiPlans) {
    try {
      const days = parseWorkoutPlan(ai.plan);
      if (!days || days.length === 0) continue;

      for (const day of days) {
        const dayStart = startOfDay(day.date);
        const dayEnd = endOfDay(day.date);

        const existing = await prisma.workoutPlan.findFirst({
          where: {
            userId: ai.userId,
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        const exercises = day.exercises.map((ex) => ({
          name: ex.name,
          sets: Array.from({ length: ex.sets }, () => ({
            reps: ex.reps,
            weight: ex.weight,
            completed: false,
          })),
        }));

        if (existing) {
          console.log(`${DRY ? '[DRY] Would update' : 'Updating'} workoutPlan for user=${ai.userId} date=${day.date.toISOString()} with ${exercises.length} exercises`);
          if (!DRY) {
            await prisma.workoutPlan.update({
              where: { id: existing.id },
              data: {
                title: day.title || existing.title,
                description: day.description || existing.description,
                exercises: JSON.stringify(exercises),
                duration: day.duration || existing.duration,
              },
            });
          }
        } else {
          console.log(`${DRY ? '[DRY] Would create' : 'Creating'} workoutPlan for user=${ai.userId} date=${day.date.toISOString()} with ${exercises.length} exercises`);
          if (!DRY) {
            await prisma.workoutPlan.create({
              data: {
                userId: ai.userId,
                title: day.title || `AI: ${ai.goal?.slice?.(0, 30) || 'Plan'}`,
                description: day.description || `Plan generated from AI: ${ai.id}`,
                date: day.date,
                time: '18:00',
                exercises: JSON.stringify(exercises),
                duration: day.duration || 60,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to reparse aiPlan id=', ai.id, err);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
