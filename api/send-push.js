const webpush = require('web-push');

// 💡 ブラウザのコンソールで作った本物の公開鍵
const PUBLIC_VAPID_KEY = 'BMXoxnbkWEt8aC-S0X1uk4BeKqznuSTxRlkLeJV-7krwUdXJs7hRIDaOlgYzePFT-wimxRJSRxgLGhGkuomU6r8';

try {
  webpush.setVapidDetails(
    'mailto:rikku5910@outlook.com',
    PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} catch (vapidError) {
  console.error('【重大】VAPID鍵の設定自体に失敗しています:', vapidError.message);
}

let savedSubscription = null;

export default async function handler(req, res) {
  // 1. iPhone側から送られてきた宛先を保存する
  if (req.method === 'POST' && req.body.registerOnly) {
    savedSubscription = req.body.subscription;
    console.log('【ログ】iPhoneからの宛先登録に成功しました:', JSON.stringify(savedSubscription));
    return res.status(200).json({ message: '宛先の登録に成功！' });
  }

  // 2. URLが叩かれた時（通知送信）
  if (req.method === 'GET') {
    if (!savedSubscription) {
      console.error('【送信エラー】通知を送る相手（宛先データ）がサーバーにありません。');
      return res.status(400).json({ error: '通知を送る相手（iPhone）がまだ登録されていません。' });
    }

    const payload = JSON.stringify({
      title: 'シンプルな自動通知',
      body: 'エラーを乗り越えて通知が届きました！'
    });

    try {
      console.log('【ログ】Apple/Googleのサーバーへ通知を送信要求中...');
      await webpush.sendNotification(savedSubscription, payload);
      console.log('【成功】通知が正常に送信されました！');
      return res.status(200).json({ success: true, message: '通知送信に成功！' });
    } catch (error) {
      // 💥 どんなエラーが起きても、中身をバラバラに分解してログに出力する
      console.error('====== ❌ 送信エラー詳細ログ ======');
      console.error('エラー名:', error.name);
      console.error('メッセージ:', error.message);
      if (error.statusCode) console.error('ステータスコード(Appleから):', error.statusCode);
      if (error.headers) console.error('エラーヘッダー:', JSON.stringify(error.headers));
      if (error.body) console.error('エラーボディ（生の理由）:', error.body);
      console.error('===================================');

      // 画面側にも詳細を少しだけ返す
      return res.status(500).json({ 
        error: error.message, 
        statusCode: error.statusCode,
        detail: error.body ? error.body.trim() : '詳細なし'
      });
    }
  }

  res.status(405).end();
}
