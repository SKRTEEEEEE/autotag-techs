# 🤖 AGENTS.md - Documentación Crítica para IAs

## ⚠️ ERROR CRÍTICO: Bucle Infinito de Commits

### 🚨 PROBLEMA IDENTIFICADO

**Fecha:** 17 de diciembre de 2025  
**Severidad:** CRÍTICA  
**Impacto:** Bucle infinito de commits que satura el repositorio

### 📋 Descripción del Problema

Cuando una GitHub Action hace commits automáticos, **por defecto GitHub Actions ejecuta workflows en TODOS los commits**, incluidos los commits hechos por bots. Esto crea un bucle infinito:

```
1. Usuario hace push
2. Action se ejecuta
3. Action hace commit (firmado como github-actions[bot])
4. GitHub detecta nuevo commit
5. Action se ejecuta DE NUEVO ← ¡BUCLE INFINITO!
6. Vuelve al paso 3 → ∞
```

### ❌ LO QUE NO FUNCIONA

**Firmar el commit como bot NO ES SUFICIENTE:**

```typescript
// ❌ ESTO NO PREVIENE EL BUCLE
await octokit.repos.createOrUpdateFileContents({
  committer: {
    name: "github-actions[bot]",
    email: "41898282+github-actions[bot]@users.noreply.github.com",
  },
  author: {
    name: "github-actions[bot]",
    email: "41898282+github-actions[bot]@users.noreply.github.com",
  },
});
```

**¿Por qué?** Porque GitHub Actions **NO** skip automáticamente los commits de bots a menos que:
- Uses `[skip ci]` en el mensaje de commit, O
- Configures el workflow para filtrar por actor

### ✅ SOLUCIÓN IMPLEMENTADA

**CAPA 1: [skip ci] en el mensaje de commit (PRINCIPAL):**

```typescript
// techs-storage.ts
await this.octokit.repos.createOrUpdateFileContents({
  message: "chore: update techs.json with detected technologies [skip ci]",
  // ...
});
```

**¿Por qué es la PRINCIPAL?** Porque GitHub Actions **NI SIQUIERA INICIA** el workflow cuando ve `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, o `***NO_CI***` en el mensaje de commit.

**CAPA 2: Check del autor al inicio de la Action (FALLBACK):**

```typescript
// src/action.ts
async run(inputs: Inputs) {
  // CRITICAL: Skip if last commit was made by github-actions[bot]
  const lastCommitAuthor = process.env.GITHUB_ACTOR ?? "";
  const isBot =
    lastCommitAuthor === "github-actions[bot]" ||
    lastCommitAuthor === "github-actions";

  if (isBot) {
    this.logger.info(
      `Skipping action: Last commit was made by ${lastCommitAuthor} (bot)`,
    );
    this.outputs.setSkipMessage(
      "Skipped to prevent infinite loop: last commit was by bot",
    );
    return; // ← EXIT TEMPRANO
  }

  // ... resto de la action
}
```

**CAPA 3: Verificar contenido antes de commit:**

```typescript
// Solo hacer commit si hay cambios REALES
if (hasChanges) {
  await this.techsStorage.updateTimestamps();
} else {
  this.logger.info("No changes detected, skipping timestamp update");
}
```

**CAPA 4: Verificar si el contenido cambió antes de push:**

```typescript
// techs-storage.ts
if (existingContent && existingContent === content) {
  this.logger.info("techs.json content unchanged, skipping GitHub API update");
  return; // ← NO HACE COMMIT
}
```

### 🎯 Cómo Verificar el Problema

**Síntomas de bucle infinito:**

```bash
# Ver últimos commits
gh api repos/OWNER/REPO/commits --jq '.[:10] | .[] | {author: .commit.author.name, message: .commit.message | split("\n")[0], date: .commit.author.date}'

# Si ves esto, HAY BUCLE:
# github-actions[bot] | chore: update techs.json | 2025-12-17T16:20:01Z
# github-actions[bot] | chore: update techs.json | 2025-12-17T16:19:30Z
# github-actions[bot] | chore: update techs.json | 2025-12-17T16:19:00Z
# github-actions[bot] | chore: update techs.json | 2025-12-17T16:18:30Z
```

**Verificar que la solución funciona:**

```bash
# El workflow debe mostrar en los logs:
# "Skipping action: Last commit was made by github-actions[bot] (bot)"
gh run view --repo OWNER/REPO --log
```

### 📚 Variables de Entorno Disponibles

```bash
# Información del commit trigger
GITHUB_ACTOR          # Usuario que hizo el push
GITHUB_TRIGGERING_ACTOR  # Puede ser diferente en algunos casos
GITHUB_EVENT_NAME     # push, pull_request, etc.

# Para workflows
github.event.head_commit.author.name  # En workflow YAML
github.actor                           # En workflow YAML
```

### 🛡️ Mejores Prácticas

1. **SIEMPRE** usa `[skip ci]` en el mensaje de commit cuando el bot hace commits automáticos
2. **SIEMPRE** agrega check de GITHUB_ACTOR como fallback de seguridad
3. **SIEMPRE** compara contenido antes de hacer commit (evitar commits vacíos)
4. **NUNCA** asumas que firmar como bot previene la re-ejecución (NO LO HACE)
5. **DOCUMENTA** este comportamiento para futuros desarrolladores/IAs

**Palabras clave que GitHub reconoce para skip CI:**
- `[skip ci]` o `[ci skip]`
- `[no ci]`
- `[skip actions]` o `[actions skip]`
- `***NO_CI***`

### 🔗 Referencias

- [GitHub Actions: Triggering a workflow](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow)
- [GitHub Actions: Using the GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Preventing workflow runs](https://docs.github.com/en/actions/managing-workflow-runs/skipping-workflow-runs)

### 📝 Historial de Cambios

- **2025-12-17:** Error identificado y solucionado después de bucle infinito en admin-next
- **Commit fix:** `fix: prevent infinite loop by skipping bot commits`

---

## 🤖 Para IAs Desarrolladoras

Si estás leyendo esto como IA:

1. **ANTES** de implementar cualquier GitHub Action que haga commits:
   - Lee esta sección completa
   - Implementa el check de bot desde el inicio
   - Verifica contenido antes de commit

2. **SI** ves commits repetidos de github-actions[bot]:
   - DETÉN inmediatamente el trabajo
   - Implementa el fix de este documento
   - Verifica que funciona antes de continuar

3. **SIEMPRE** pregunta al usuario si detectas patrones sospechosos

**Este error puede saturar repositorios en minutos. Tómalo en serio.**

---

## 📞 Contacto

Si encuentras más patrones problemáticos, documéntalos aquí para futuros desarrolladores.
