const admin = require('firebase-admin');
// ダウンロードしたJSONファイルを読み込む
const serviceAccount = require('./firebase-key.json');

// 最初の一回だけ初期化する
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

let savedToken = null; // テスト用にメモリに保存

export default async function handler(req, res) {
  // 1. iPhone側から送られてきたトークン（宛先）を保存する
  if (req.method === 'POST' && req.body.registerOnly) {
    savedToken = req.body.token; // トークン文字列を保存
    return res.status(200).json({ message: '宛先の登録に成功！' });
  }

  // 2. URLが叩かれた時（通知送信）
  if (req.method === 'GET') {
    if (!savedToken) {
      return res.status(400).json({ error: '通知を送る相手が登録されていません。' });
    }

    const message = {
      notification: {
        title: '自動通知が届いたよ！',
        body: '指定されたURLが叩かれたので、Firebase経由で自動送信しました。'
      },
      token: savedToken // iPhoneのトークン
    };

    try {
      await admin.messaging().send(message);
      return res.status(200).json({ success: true, message: '通知送信に成功！' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).end();
}
