# Vision Live Frontend

Cliente React/Vite da plataforma. Ele captura a camera no navegador e envia frames ao backend por WebSocket.

Toda API, inferencia, modelo e qualquer token ficam no backend.

## Rodar localmente

```powershell
.\start.ps1
```

Ou manualmente:

```powershell
npm install
npm run dev
```

## Configuracao

Copie `.env.example` para `.env` se precisar mudar a URL do backend:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

Em producao, use a URL publica do backend:

```env
VITE_BACKEND_URL=https://sua-api-online.com
```

Camera no navegador em producao normalmente exige HTTPS.

## Deploy

O frontend tem `Dockerfile`, `nginx.conf` e `render.yaml`. Antes de buildar para producao, configure `VITE_BACKEND_URL` com a URL publica do backend.

Use `.env.production.example` como referencia de variaveis online.
