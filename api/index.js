// File: /api/index.js

export default function handler(req, res) {
  // Hanya proses POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // PERBAIKAN: Gunakan req.body, bukan req.json().
    // Vercel secara otomatis mem-parse body untuk request dengan Content-Type: application/json.
    const body = req.body;

    // Menambahkan pengecekan untuk memastikan payload valid
    if (!body || !body.untrustedData || !body.untrustedData.buttonIndex) {
        console.error("Invalid or missing frame payload:", body);
        return res.status(400).send('Invalid frame payload');
    }

    // Dapatkan nomor tombol yang diklik dari payload Farcaster
    const buttonIndex = body.untrustedData.buttonIndex;

    let imageUrl;
    let targetUrl;

    if (buttonIndex === 1) {
      // Logika untuk tombol "Play Star Catcher"
      // Ganti dengan gambar spesifik untuk Star Catcher jika ada
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/star_catcher_frame.png"; 
      targetUrl = "https://star-catcher-farcaster.vercel.app/StarCatcher";
    } else if (buttonIndex === 2) {
      // Logika untuk tombol "Join Lottery"
      // Ganti dengan gambar spesifik untuk Lottery jika ada
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/lottery_frame.png";
      targetUrl = "https://star-catcher-farcaster.vercel.app/lottery";
    } else {
      // Fallback jika terjadi kesalahan (seharusnya tidak terjadi)
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg";
      targetUrl = "https://star-catcher-farcaster.vercel.app";
    }

    // Kirim respons HTML dengan frame baru yang berisi tombol "link"
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Farcaster Games</title>
          <meta property="og:title" content="Farcaster Games" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Click to Play!" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${targetUrl}" />
        </head>
        <body>
          <p>Redirecting to the game...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in frame API:', error);
    res.status(500).send('Error generating frame');
  }
}
