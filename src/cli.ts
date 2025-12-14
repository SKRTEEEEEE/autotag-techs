//Mixed debounce function

import { debounce } from './debounce';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter text for call/recall the debounced function: \n'
});

console.log(`Debounce test function CLI:

Send a message to call the debounced 5 sec example function:
(Type 'exit' to quit)
`);

// Función de ejemplo para usar con debounce
function exampleFunction(text: string) {
    console.log(`Example function called with: ${text}`);
    rl.prompt() // Llamar al prompt una vez ejecutada la función
}

const debouncedFunc = debounce((input: string) => {
    exampleFunction(input);
}, 5000);

const startCLI = () => {
    rl.prompt();

    rl.on('line', (input) => {
        if (input.trim().toLowerCase() === 'exit') {
            rl.close();
            return;
        }
        if(input){
            debouncedFunc(input);
        }
    }).on('close', () => {
        console.log('CLI closed.');
        process.exit(0);
    });
};

startCLI();
