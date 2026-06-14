// サーバーからプッシュ通知を受信した時のイベント
self.addEventListener('push', function(event) {
  let title = '新着通知';
  let options = {
    body: 'アプリからのメッセージを受信しました！',
    icon: '/icon-192.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
    } catch (e) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
