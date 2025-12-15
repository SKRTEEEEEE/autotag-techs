# Re-factorizar app

## Objetivo

Mejorar el rendimiento, reduciendo llamadas a la api y limitando el numero de llamadas a la github action

## Key points

- [ ] Implementar creación de archivo ./.github/techs.json
  - [ ] Se guardara cada vez que se detecte una nueva tech, se registrara con {"DD-MM-YYYY-HH": ["tech", "other-tech"]}
  - [ ] Se guardaran los nombres de "nameBadge" - los mismos que se usan para poner en 'Topics' de Github
  - [ ] Se implementara la opcion del campo 'user'. Los cuales son 'techs' las cuales se incluiran en 'Topics' y no se borraran hasta desaparecer de esta lista
- [ ] Si ya esta en ./.github/techs.json, no hace falta llamar a la api(https://kind-creation-production.up.railway.app/pre-tech?q=)
- [ ] Si no ha cambiado el archivo de dependencias o el archivo de ./.github/techs.json en 'la ultima activación' (push, PR, etc..) NO ES NECESARIO EJECUTAR LA ACTION
- [ ] Respetar siempre la conversion **`.` -> `dot` or `-`**
  - Cuando hablamos de 'nameId' de la API -> puede contener `.`
  - Cuando hablamos de 'nameBadge', que es el mismo que se usa para `./.github/techs.json` y 'Topics' de Github -> ha de contener `dot` or `-`
