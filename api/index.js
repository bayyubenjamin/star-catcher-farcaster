// File: /api/index.js

export default function handler(req, res) {
  // Hanya izinkan POST request
  if (req.method === 'POST') {
    const gameUrl = 'https://star-catcher-farcaster.vercel.app';

    // Atur header 'Location' untuk memberitahu ke mana harus redirect
    res.setHeader('Location', gameUrl);

    // Kirim status 302 (Found), yang merupakan kode standar untuk redirect
    return res.status(302).end();
  } else {
    // Jika ada request selain POST, kirim error
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
