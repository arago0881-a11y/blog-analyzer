export default async function handler(req, res) {
  // OPTIONS 요청 허용 (CORS preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = req.headers['x-naver-client-id'];
  const clientSecret = req.headers['x-naver-client-secret'];

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'API 키가 없습니다' });
  }

  const { blogId } = req.body;
  if (!blogId) return res.status(400).json({ error: 'blogId 필요' });

  const queries = [
    `blog.naver.com/${blogId}`,
    blogId,
  ];

  try {
    const results = await Promise.all(
      queries.map(async (q) => {
        const resp = await fetch(
          `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(q)}&display=100&sort=date`,
          {
            headers: {
              'X-Naver-Client-Id': clientId,
              'X-Naver-Client-Secret': clientSecret,
            },
          }
        );
        if (!resp.ok) return [];
        const data = await resp.json();
        return data.items || [];
      })
    );

    const seen = new Set();
    const merged = results.flat().filter((item) => {
      if (!item.link || seen.has(item.link)) return false;
      seen.add(item.link);
      return item.link.includes(blogId);
    });
    merged.sort((a, b) => (b.postdate || '').localeCompare(a.postdate || ''));

    return res.status(200).json({ items: merged, total: merged.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}