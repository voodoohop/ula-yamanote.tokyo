import { Handler } from '@netlify/functions'

interface GeoResponse {
  status: string;
  city: string;
  country: string;
  regionName: string;
  message?: string;
}

const handler: Handler = async (event, context) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip']
  const userAgent = event.headers['user-agent']
  const timestamp = new Date().toISOString()
  
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}`)
    const geoData = await geoResponse.json() as GeoResponse
    
    if (geoData.status === 'success' && geoData.city && geoData.country) {
      console.log(`[VISITOR] IP: ${ip} | Location: ${geoData.city}, ${geoData.regionName}, ${geoData.country} | UA: ${userAgent} | Time: ${timestamp}`)
    } else {
      console.log(`[VISITOR] IP: ${ip} | Location: API Error (${geoData.message || 'unknown'}) | UA: ${userAgent} | Time: ${timestamp}`)
      console.error('Geo API response:', JSON.stringify(geoData))
    }
  } catch (error) {
    console.log(`[VISITOR] IP: ${ip} | Location: Request Failed | UA: ${userAgent} | Time: ${timestamp}`)
    console.error('Geo lookup failed:', error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Logged' }),
  }
}

export { handler }
