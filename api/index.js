// File: /api/index.js

export default async function handler(req, res) {
  // Hanya proses POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const body = await req.json();
    // Dapatkan nomor tombol yang diklik dari payload Farcaster
    const buttonIndex = body.untrustedData.buttonIndex;

    let imageUrl;
    let targetUrl;

    if (buttonIndex === 1) {
      // Logika untuk tombol "Play Star Catcher"
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/star_catcher_frame.png"; // Ganti dengan gambar spesifik untuk Star Catcher
      targetUrl = "https://star-catcher-farcaster.vercel.app/StarCatcher";
    } else if (buttonIndex === 2) {
      // Logika untuk tombol "Join Lottery"
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/lottery_frame.png"; // Ganti dengan gambar spesifik untuk Lottery
      targetUrl = "https://star-catcher-farcaster.vercel.app/lottery";
    } else {
      // Fallback jika terjadi kesalahan
      imageUrl = "https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg";
      targetUrl = "https://star-catcher-farcaster.vercel.app";
    }

    // Kirim respons HTML dengan frame baru yang berisi tombol "link"
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Star Caster Games</title>
          <meta property="og:title" content="Star Caster Games" />
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
    console.error(error);
    res.status(500).send('Error generating frame');
  }
}
