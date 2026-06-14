const admin = require('firebase-admin');

// サーバーレス関数が実行されるたびに何度も初期化されるのを防ぐ
if (!admin.apps.length) {
  try {
    // 1. Vercelの設定画面から、貼り付けたJSONの文字列を取得してオブジェクトに変換する
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebaseの初期化に成功しました。");
  } catch (error) {
    console.error('Firebaseの初期化に失敗しました。環境変数の値（JSON）が正しいか確認してください:', error);
  }
}

// 簡易的にトークンを記憶する用（テスト用）
let savedToken = null;

export default async function handler(req, res) {
  // iPhone側から送られてきたトークンを保存する処理
  if (req.method === 'POST' && req.body.registerOnly) {
    savedToken = req.body.token;
    return res.status(200).json({ message: '宛先トークンの登録に成功！' });
  }

  // URLが叩かれた時の処理（通知送信）
  if (req.method === 'GET') {
    if (!savedToken) {
      return res.status(400).json({ error: '通知を送る相手（iPhone）がまだ登録されていません。' });
    }

    const message = {
      notification: {
        title: '自動通知のテスト',
        body: '環境変数を使った安全なシステムから自動送信されました！'
      },
      token: savedToken
    };

    try {
      await admin.messaging().send(message);
      return res.status(200).json({ success: true, message: 'iPhoneへの通知送信に成功しました！' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).end();
}
