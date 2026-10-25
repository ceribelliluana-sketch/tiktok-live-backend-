const TikTokLiveConnector = require('tiktok-live-connector');
// Trata a importação independentemente da versão da biblioteca instalada
const WebcastPushConnection = TikTokLiveConnector.WebcastPushConnection || TikTokLiveConnector;
const WebSocket = require('ws');

// ⚠️ SUBSTITUA PELO NOME DE USUÁRIO DO TIKTOK QUE ESTÁ AO VIVO (sem o @)
const TIKTOK_USERNAME = "stream.kwpubg";

// Pega a porta dinâmica do Render ou usa a 8080 localmente
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
});

// Transmite dados para todos os painéis HTML conectados
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

// Conecta ao TikTok Live
const tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokLiveConnection.connect().then(state => {
  console.log(`✅ Conectado com sucesso à live de @${TIKTOK_USERNAME}`);
}).catch(err => {
  console.error("❌ Falha ao conectar na live do TikTok:", err);
});

// --- CURTIDAS (LIKES) ---
tiktokLiveConnection.on('like', (data) => {
  broadcast({ type: 'like', user: `@${data.uniqueId}`, count: data.likeCount });
});

// --- COMENTÁRIOS DO CHAT ---
tiktokLiveConnection.on('chat', (data) => {
  broadcast({ type: 'comment', user: `@${data.uniqueId}`, comment: data.comment });
});

// --- PRESENTES (GIFTS) ---
tiktokLiveConnection.on('gift', (data) => {
  if (data.giftType === 1 && data.repeatEnd === false) return; // Espera o combo acabar
  broadcast({
    type: 'gift',
    user: `@${data.uniqueId}`,
    giftName: data.giftName,
    diamondCount: data.diamondCount * data.repeatCount
  });
});
