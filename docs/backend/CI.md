CI for alms
==========

This project includes a GitHub Actions workflow at `.github/workflows/ci.yml` with two stages:

- `lint-and-test`: runs on push and pull requests. It:
  - installs dependencies (root workspace)
  - runs `npm run prisma:generate`
  - builds the backend TypeScript
  - runs `npm run lint`
  - runs frontend tests (`npm -w frontend run test`)

- `integration` (optional): spins up `docker-compose.full.yml` on the runner, waits for the backend to respond, runs basic smoke checks, and then tears down the stack.

How to trigger the integration job in GitHub Actions:
- From the Actions UI use `Run workflow` and set the `integration` input to `true`.
- Alternatively, include `[integration]` in your commit message to trigger the job automatically.

Notes for maintainers:
- The integration job in the provided workflow uses the default Postgres credentials defined in `docker-compose.full.yml`. If you need to run the integration job against different credentials or external services, add repository secrets and update the workflow to export them to the runner before `docker compose up`.
- The integration job is intentionally lightweight (just smoke checks). For full end-to-end tests you can extend the workflow to run your test suite against the running stack.

Local equivalent:
- To run the integration steps locally use:

```powershell
# from repo root
docker compose -f docker-compose.full.yml up --build -d
# wait until services are healthy then run smoke checks
Invoke-WebRequest -UseBasicParsing http://localhost:3001/users | Select-Object StatusCode
# when done
docker compose -f docker-compose.full.yml down -v
```
