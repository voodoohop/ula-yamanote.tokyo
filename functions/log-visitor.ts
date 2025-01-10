import { Handler } from '@netlify/functions'
import { getStore } from "@netlify/blobs"

interface GeoResponse {
  status: string;
  city: string;
  country: string;
  regionName: string;
  message?: string;
}

interface VisitorLog {
  ip: string
  location: string
  userAgent: string
  timestamp: string
}

const handler: Handler = async (event, context) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip']
  const userAgent = event.headers['user-agent']
  const timestamp = new Date().toISOString()
  
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}`)
    const geoData = await geoResponse.json() as GeoResponse
    
    let location = 'Unknown'
    if (geoData.status === 'success' && geoData.city && geoData.country) {
      location = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`
    } else if (geoData.message) {
      location = `Error: ${geoData.message}`
    }

    // Get the store
    const store = getStore({
      name: "visitor-logs"
    });

    // Create log entry
    const logEntry: VisitorLog = {
      ip,
      location,
      userAgent,
      timestamp
    }

    // Append to the list of logs
    const existingLogs = await store.get('logs') || '[]'
    const logs = JSON.parse(existingLogs as string)
    logs.push(logEntry)
    
    // Store back in KV store
    await store.set('logs', JSON.stringify(logs))
    
    console.log(`[VISITOR] IP: ${ip} | Location: ${location} | UA: ${userAgent}`)
  } catch (error) {
    console.error('Failed to log visitor:', error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Logged' }),
  }
}

export { handler }
