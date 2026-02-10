export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  
  // Pobieramy cokolwiek - czy to 'q' czy 'name'
  const query = searchParams.get('q') || searchParams.get('name') || "";

  if (query.length < 3) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Używamy darmowego i otwartego API Nominatim (bez kluczy i loginów)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VeritasApp/1.0' }
    });
    const data = await response.json();

    const cities = data.map(item => ({
      label: item.display_name,
      lat: item.lat,
      lon: item.lon
    }));

    return new Response(JSON.stringify(cities), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), { 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
