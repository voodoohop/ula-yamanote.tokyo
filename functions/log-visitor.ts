import { Handler } from '@netlify/functions'

const handler: Handler = async (event, context) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip']
  const userAgent = event.headers['user-agent']
  const timestamp = new Date().toISOString()
  
  try {
    const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
    const geoData = await geoResponse.json()
    
    console.log(`[VISITOR] IP: ${ip} | Location: ${geoData.city}, ${geoData.country_name} | UA: ${userAgent} | Time: ${timestamp}`)
  } catch (error) {
    console.log(`[VISITOR] IP: ${ip} | Location: Unknown | UA: ${userAgent} | Time: ${timestamp}`)
    console.error('Geo lookup failed:', error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Logged' }),
  }
}

export { handler }
