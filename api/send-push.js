const webpush = require('web-push');

// 💡 ここにあなたの「公開鍵」を直接書く（公開鍵は流出しても安全な鍵です）
const PUBLIC_VAPID_KEY = 'BMXoxnbkWEt8aC-S0X1uk4BeKqznuSTxRlkLeJV-7krwUdXJs7hRIDaOlgYzePFT-wimxRJSRxgLGhGkuomU6r8';

webpush.setVapidDetails(
  'mailto:rikku5910@outlook.com', // あなたのメールアドレス（形式だけでOK）
  PUBLIC_VAPID_KEY,
  process.env.VAPID_PRIVATE_KEY // Vercelの隠しポケットから秘密鍵を読み込む
);

let savedSubscription = null; // テスト用の宛先一時保存

export default async function handler(req, res) {
  // 1. iPhone側から送られてきた宛先を保存する
  if (req.method === 'POST' && req.body.registerOnly) {
    savedSubscription = req.body.subscription;
    return res.status(200).json({ message: '宛先の登録に成功！' });
  }

  // 2. URLが叩かれた時（通知送信）
  if (req.method === 'GET') {
    if (!savedSubscription) {
      return res.status(400).json({ error: '通知を送る相手（iPhone）がまだ登録されていません。' });
    }

    const payload = JSON.stringify({
      title: 'シンプルな自動通知',
      body: 'Firebaseなし、VAPIDの鍵だけで自動送信に成功しました！'
    });

    try {
      await webpush.sendNotification(savedSubscription, payload);
      return res.status(200).json({ success: true, message: '通知送信に成功！' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).end();
}
