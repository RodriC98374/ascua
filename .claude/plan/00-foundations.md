# 00 — Fundaciones

**Objetivo:** que exista el esqueleto completo y que el ciclo "cambio → test → deploy" funcione de punta a punta antes de escribir lógica de negocio.

## A. Pasos manuales del usuario (consola web)

Claude no puede hacerlos. Hacerlos antes que la parte B.

1. **GitHub:** crear un repositorio **privado** vacío (sin README ni .gitignore) y pasar la URL. Claude agrega el remoto y hace el primer push.
2. **Firebase:** crear el proyecto (sin Google Analytics). Pasar el `projectId`.
3. **Plan Blaze:** activarlo y crear una **alerta de presupuesto** de USD 5/mes (Google Cloud → Facturación → Presupuestos y alertas).
4. **Firestore:** crear la base en modo producción, región **`southamerica-east1`**. La región no se puede cambiar después.
5. **Authentication:** habilitar el proveedor Correo/contraseña. El registro se cierra en la fase 04.
6. **Web app:** registrar una app web en el proyecto y pasar el objeto `firebaseConfig`. No es secreto, pero va en `.env.local`.

## B. Tareas

- [ ] Root: `package.json` con npm workspaces (`apps/*`, `functions`, `packages/*`), `.nvmrc` (22), `engines`.
- [ ] `packages/shared`: paquete TypeScript vacío que compila y se importa desde los otros dos.
- [ ] `apps/web`: Vite + React + TS strict, Tailwind, React Router, una página "hola" que muestra un valor importado de `shared`.
- [ ] `functions`: TypeScript, `firebase-functions` v2, región `southamerica-east1`, una función `healthCheck` de prueba.
- [ ] ESLint + Prettier compartidos en la raíz.
- [ ] Vitest configurado en los tres paquetes, con un test trivial en cada uno.
- [ ] `firebase-tools` como devDependency; `firebase.json`, `.firebaserc`, `firestore.rules` (todo denegado), `firestore.indexes.json`.
- [ ] Emulator Suite (Auth, Firestore, Functions, Hosting) con `npm run emulators`.
- [ ] Scripts raíz: `dev`, `build`, `lint`, `typecheck`, `test`, `emulators`, `deploy`.
- [ ] GitHub Actions: en cada push, `lint` + `typecheck` + `test`.
- [ ] Primer deploy de Hosting con la página "hola".
- [ ] `CLAUDE.md`: sección de comandos con los reales, incluido cómo correr un solo test.

## Definición de terminado

- `npm install && npm test` en verde desde un clon limpio (probarlo en la otra máquina).
- `npm run emulators` levanta todo y la app local habla con el emulador.
- La URL de Firebase Hosting muestra la página "hola" en el celular.
- El CI está en verde en GitHub.

## Riesgos

- **Región equivocada:** es irreversible. Verificar `southamerica-east1` antes de confirmar la creación de Firestore.
- Los emuladores requieren Java 11+ instalado en cada máquina.
