# Vision Live Frontend

Cliente React/Vite da plataforma. Ele captura a camera no navegador e envia frames ao backend por WebSocket.

Toda API, inferencia, modelo e qualquer token ficam no backend.

O contador tambem vem do backend. O frontend apenas exibe os campos `counts` retornados pelo WebSocket.

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
VITE_WEBRTC_STREAM_URL=
```

Em producao, use a URL publica do backend:

```env
VITE_BACKEND_URL=https://sua-api-online.com
```

Camera no navegador em producao normalmente exige HTTPS.

## WebRTC externo

Para camera IP/RTSP, use um media server como MediaMTX para converter RTSP em WebRTC e configure:

```env
VITE_WEBRTC_STREAM_URL=https://url-do-mediamtx/camera
```

Esse stream e para visualizacao. A deteccao/contagem continua no backend.

## Deploy

O frontend tem `Dockerfile`, `nginx.conf` e `render.yaml`. Antes de buildar para producao, configure `VITE_BACKEND_URL` com a URL publica do backend.

Use `.env.production.example` como referencia de variaveis online.
