import inquirer from "inquirer";

export async function askTasksAndGoals() {
  const { tasks } = await inquirer.prompt([
    {
      name: "tasks",
      type: "input",
      message: "Escribe una tarea dinámica (separa por coma si varias):",
      filter: (input: string) => input.split(",").map(s => s.trim())
    }
  ]);

  const { goals } = await inquirer.prompt([
    {
      name: "goals",
      type: "checkbox",
      message: "Selecciona tus objetivos de esta semana:",
      choices: [
        "No consumir alcohol",
        "Meditar 20 min",
        "Ejercicio",
        "Dormir 8 horas"
      ]
    }
  ]);

  return { tasks, goals };
}
