Prisma generate EPERM on Windows

Problem

- Running `npm run prisma:generate` once failed with an EPERM during rename of a query engine temp file:
  EPERM: operation not permitted, rename '...\query_engine-windows.dll.node.tmpXXXX' -> '...\query_engine-windows.dll.node'

What I did

1. Inspected `node_modules\.prisma\client` and found multiple `query_engine-windows.dll.node.tmp*` files alongside the target `query_engine-windows.dll.node`.
2. Deleted the stale `.tmp` file that matched the error (`query_engine-windows.dll.node.tmp34456`).
3. Re-ran `npm run prisma:generate` from `backend` and it succeeded: "Generated Prisma Client (v6.14.0)".

Recommendations

- If you see this error and cannot delete the `.tmp` file, it may be locked by another process (antivirus, an editor, or a running Node process). Try:
  - Closing editors or Node processes that might access the file.
  - Running PowerShell as Administrator.
  - Temporarily disabling Windows Defender or third-party antivirus and retrying.
  - Rebooting to clear file locks.

- Long-term: consider setting PRISMA_CLIENT_ENGINE_TYPE=library in .env or upgrading Prisma if this happens frequently.

Commands used

- Remove file (PowerShell):
  Remove-Item -LiteralPath 'C:\Users\preml\Desktop\office\LMS\node_modules\.prisma\client\query_engine-windows.dll.node.tmp34456' -Force

- Regenerate (from backend):
  npm run prisma:generate

Notes

- The immediate fix here was removing the stale temp file. The root cause may be an interrupted earlier generate or a concurrent process interfering with Prisma's file replace.
