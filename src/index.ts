import { ProjectService } from "./app";
import { askTasksAndGoals } from "./infra";


async function main() {
  console.log("🚀 Bienvenido a tu Project Weekly Template!");

  const answers = await askTasksAndGoals();

  const service = new ProjectService("Calendario Semanal");
  service.addTasks(answers.tasks);
  service.addGoals(answers.goals);

  const project = service.getProject();

  console.log("✅ Project creado:");
  console.log(project.toJSON());
}

main();
