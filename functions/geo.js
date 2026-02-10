export async function onRequest(context) {
  const { request, ctx } = context;
  const url = new URL(request.url);

  // Get the ?q= query parameter
  const q = url.searchParams.get('q');

  // Security check
  if (!q || q.length < 3) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Nominatim API URL
  const nominatimURL =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json` +
    `&q=${encodeURIComponent(q)}` +
    `&limit=5` +
    `&addressdetails=0`;

  // CACHE (Cloudflare Edge)
  const cacheKey = new Request(nominatimURL);
  const cache = caches.default;

  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // Request to Nominatim (ToS-compliant)
  const upstream = await fetch(nominatimURL, {
    headers: {
      'User-Agent': 'VERITAS/1.0 (contact@veritas.app)',
      'Accept': 'application/json'
    }
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify([]), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await upstream.json();

  // Normalize data (important for frontend)
  const normalized = data.map(item => ({
    label: item.display_name,
    lat: item.lat,
    lon: item.lon
  }));

  response = new Response(JSON.stringify(normalized), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });

  // Save to cache
  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
