// Membungkus handler gaya Vercel (req, res) agar jalan di Netlify Functions
module.exports = (handler) => async (event) => {
  const headers = {};
  const h = event.headers || {};
  let body = event.body;
  if (body && event.isBase64Encoded) body = Buffer.from(body, 'base64').toString();
  if (typeof body === 'string' && /json/i.test(h['content-type'] || '')) {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const req = {
    method: event.httpMethod,
    query: event.queryStringParameters || {},
    headers: h,
    url: event.rawUrl || event.path,
    body,
  };
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      setHeader(k, v) { headers[k] = v; },
      end(b) {
        const isBuf = Buffer.isBuffer(b);
        resolve({
          statusCode: this.statusCode,
          headers,
          body: b == null ? '' : (isBuf ? b.toString('base64') : String(b)),
          isBase64Encoded: isBuf,
        });
      },
    };
    Promise.resolve(handler(req, res)).catch((e) =>
      resolve({ statusCode: 500, body: JSON.stringify({ status: false, message: String((e && e.message) || e) }) })
    );
  });
};
