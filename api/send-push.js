const webpush = require('web-push');

// 💡 ブラウザのコンソールで作った【確定版】の公開鍵
const PUBLIC_VAPID_KEY = 'BOpmtRvUOw1ko2WbyNElTnGtuuO1xsrE5WJ-wLivdpbgOQCrSPdSrTw_1mX9Js0BPEe9NNo87F9oxcXCa8wiVug';

try {
  webpush.setVapidDetails(
    'mailto:rikku5910@outlook.com',
    PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} catch (vapidError) {
  console.error('VAPID設定エラー:', vapidError.message);
}

let savedSubscription = null;

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
      body: 'エラーをすべて乗り越えて、ついに通知が届きました！'
    });

    try {
      // 💡 【超重要：Windows/Vercel環境での401エラーを絶対殺す設定】
      // Appleのサーバーに送るリクエストのヘッダーを、手動で完璧に構築して上書きします
      const options = {
        headers: {
          'Authorization': webpush.getVapidHeaders(
            savedSubscription.endpoint,
            'mailto:rikku5910@outlook.com',
            PUBLIC_VAPID_KEY,
            process.env.VAPID_PRIVATE_KEY
          ).Authorization
        }
      };

      // 自作した完璧なヘッダー（options）を添えて通知を送信！
      await webpush.sendNotification(savedSubscription, payload, options);
      
      return res.status(200).json({ success: true, message: '通知送信に成功！' });
    } catch (error) {
      console.error('送信エラー詳細:', error.message);
      return res.status(500).json({ 
        error: error.message, 
        statusCode: error.statusCode,
        detail: error.body ? error.body.trim() : '詳細なし'
      });
    }
  }

  res.status(405).end();
}
