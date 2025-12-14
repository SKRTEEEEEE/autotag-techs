refactor(v0.11.2): Adaptar a Windows + Bash (Terminal de Git). Closes #1

## Cambios Realizados

1. **Creación de guía de inicio para Windows y Git Bash**
   - Nuevo archivo `docs/start.md` con instrucciones detalladas
   - Guía completa de instalación y uso en Windows con terminal Git Bash
   - Instrucciones específicas para herramientas como typos-cli y yamllint

2. **Actualización de README.md**
   - Sección "Quick Start" que referencia la nueva guía
   - Eliminación de sección "Other templates" de AlbertHernandez
   - Actualización de ejemplo de uso

3. **Reemplazo de referencias de AlbertHernandez → SKRTEEEEEE en:**
   - LICENSE.md (copyright)
   - package.json (author, URLs de repositorio)
   - action.yml (author)
   - README.md (badges, enlaces)

4. **Adaptación de scripts para compatibilidad Windows+Git Bash**
   - Actualización de scripts/check_typos.sh con instrucciones para Windows
   - Actualización de scripts/lint_yaml.sh con opciones de instalación
   - Modificación de package.json para usar `bash scripts/...` en lugar de `chmod`
   - Mensajes de error mejorados con instrucciones específicas

## Validación Realizada

Se ejecutaron las siguientes verificaciones:

```bash
pnpm validate-typescript  # ✅ TypeScript validation exitosa
pnpm lint:fix            # ✅ Linting issues corregidos
pnpm build               # ✅ Build exitoso (dist/index.js generado)
pnpm test                # ✅ Todos los tests pasaron (8 tests)
pnpm lint:yaml           # ✅ Script funciona (muestra instrucciones de instalación)
pnpm typos               # ✅ Script funciona (muestra instrucciones de instalación)
```

Comprobaciones adicionales:
- Archivos de distribución generados correctamente en `dist/`
- Configuración de Git Bash verificada
- Compatibilidad con line endings de Windows (CRLF)

## Notas y Riesgos

- Los scripts now usan `bash` en lugar de `chmod`+direct execution
- Se mantuvieron todas las funcionalidades originales
- Los tooling externos (typos-cli, yamllint) pueden requerir instalación manual en Windows
- La configuración de Git se adaptó para manejar automáticamente la conversión LF→CRLF

## Próximos Pasos

- Los usuarios pueden seguir la guía en `docs/start.md` para empezar con el template
- Considerar crear un instalador automático para las dependencias de Windows
- Evaluar agregar soporte para Windows PowerShell en futuras versiones
