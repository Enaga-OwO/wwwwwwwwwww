const webpush = require('web-push');

// 暗号化の鍵を設定（Firebase等で発行した秘密鍵と公開鍵）
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'YOUR_PUBLIC_VAPID_KEY',
  'YOUR_PRIVATE_VAPID_KEY'
);

// 簡易的に記憶する用（本来はデータベースに保存しますが、テスト用にメモリ上に1件保持します）
let savedSubscription = null;

export default async function handler(req, res) {
  // 1. 初回起動時：iPhone側から送られてきた宛先（トークン）を保存する
  if (req.method === 'POST' && req.body.registerOnly) {
    savedSubscription = req.body.subscription;
    return res.status(200).json({ message: '宛先の登録に成功！' });
  }

  // 2. このURLが「GET」で叩かれた時：登録されているiPhoneに向けて通知を飛ばす！
  if (req.method === 'GET') {
    if (!savedSubscription) {
      return res.status(400).json({ error: '通知を送る相手（iPhone）がまだ登録されていません。' });
    }

    const payload = JSON.stringify({
      title: '自動通知が届いたよ！',
      body: '指定されたURLが叩かれたので、自動でプッシュ通知を送信しました。'
    });

    try {
      await webpush.sendNotification(savedSubscription, payload);
      return res.status(200).json({ success: true, message: 'iPhoneへの通知送信に成功しました！' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).end();
}
