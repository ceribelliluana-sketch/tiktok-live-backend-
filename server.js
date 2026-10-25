const TikTokLive = require('tiktok-live-connector');
const WebSocket = require('ws');

// Se o pacote for a função diretamente ou propriedade, apanhamos aqui
const WebcastPushConnection = TikTokLive.WebcastPushConnection || TikTokLive;

const TIKTOK_USERNAME = "stream.kwpubg";
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log("🟢 O painel 3D acabou de se conectar!");
  ws.on('close', () => console.log("🔴 O painel se desconectou."));
});

const tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokLiveConnection.connect().then(state => {
  console.log(`✅ Conectado com sucesso à live de @${TIKTOK_USERNAME}`);
}).catch(err => {
  console.error("❌ Falha ao conectar na live do TikTok:", err);
});

tiktokLiveConnection.on('like', (data) => {
  broadcast({ type: 'like', user: `@${data.uniqueId}`, count: data.likeCount });
});

tiktokLiveConnection.on('chat', (data) => {
  broadcast({ type: 'comment', user: `@${data.uniqueId}`, comment: data.comment });
});

tiktokLiveConnection.on('gift', (data) => {
  if (data.giftType === 1 && data.repeatEnd === false) return;
  broadcast({
    type: 'gift',
    user: `@${data.uniqueId}`,
    giftName: data.giftName,
    diamondCount: data.diamondCount * data.repeatCount
  });
});
