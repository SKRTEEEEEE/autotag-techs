# Re-factorizar app

## Objetivo

Mejorar el rendimiento, reduciendo llamadas a la api y limitando el numero de llamadas a la github action

## Key points

- [ ] Si ya esta en topics, no hace falta llamar a la api
- [ ] Si no ha cambiado el archivo de dependencias en 'la ultima activación' (push, PR, etc..) NO ES NECESARIO EJECUTAR LA ACTION
