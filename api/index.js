// File: /api/index.js

export default function handler(req, res) {
  // Pastikan ini adalah POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // URL tujuan game Anda
  const gameUrl = 'https://star-catcher-farcaster.vercel.app';

  // Kirim respons HTML yang akan me-redirect pengguna ke halaman game
  // Ini adalah cara paling sederhana untuk "membuka" aplikasi setelah tombol ditekan
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting to Game</title>
        <meta http-equiv="refresh" content="0; url=${gameUrl}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://i.imgur.com/gantidenganurlgambarmu.png" />
        <meta property="og:image" content="https://i.imgur.com/gantidenganurlgambarmu.png" />
        <meta property="fc:frame:post_url" content="${gameUrl}/api" />
      </head>
      <body>
        <p>Redirecting you to the game...</p>
      </body>
    </html>
  `);
}
