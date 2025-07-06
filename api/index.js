// File: /api/index.js

export default function handler(req, res) {
  // Hanya proses POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const gameUrl = 'https://star-catcher-farcaster.vercel.app';

  // Kirim respons berupa halaman HTML lengkap
  // Halaman ini berisi meta refresh (untuk redirect) dan meta frame (untuk konfirmasi)
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting to Star Catcher</title>
        
        <meta http-equiv="refresh" content="0; url=${gameUrl}" />

        <meta property="og:title" content="Redirecting to Game" />
        <meta property="og:image" content="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg" />

      </head>
      <body>
        <p>Redirecting to the game... If you are not redirected automatically, <a href="${gameUrl}">click here</a>.</p>
      </body>
    </html>
  `);
}
