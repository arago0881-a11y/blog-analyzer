// pages/api/naver/datalab-blog.js
// DataLab 블로그 키워드 포스팅 추이 API 프록시
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId     = req.headers['x-naver-client-id'];
  const clientSecret = req.headers['x-naver-client-secret'];
  if (!clientId || !clientSecret) return res.status(400).json({ error: 'API 키 없음' });

  const { keywords } = req.body;
  if (!keywords?.length) return res.status(400).json({ error: 'keywords 필요' });

  const now       = new Date();
  const endDate   = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    .toISOString().slice(0, 10);

  try {
    const resp = await fetch('https://openapi.naver.com/v1/datalab/blog/keyword', {
      method:  'POST',
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
        'Content-Type':          'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: 'month',
        keywordGroups: keywords.slice(0, 5).map((kw) => ({
          groupName: kw,
          keywords:  [kw],
        })),
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `네이버 API 오류 ${resp.status}`, detail: text });
    }

    const data = await resp.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
