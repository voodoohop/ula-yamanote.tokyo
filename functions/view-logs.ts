import { Handler } from '@netlify/functions'
import { getStore } from "@netlify/blobs"

interface VisitorLog {
  ip: string
  location: string
  userAgent: string
  timestamp: string
}

const handler: Handler = async (event, context) => {
  // Basic auth check
  const authHeader = event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.LOGS_ACCESS_TOKEN) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  try {
    const store = getStore({
      name: "visitor-logs"
    });

    const logsData = await store.get('logs') || '[]'
    const logs = JSON.parse(logsData as string) as VisitorLog[]

    // Sort logs by timestamp, newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Format logs for display
    const formattedLogs = logs.map(log => {
      const date = new Date(log.timestamp).toLocaleString()
      return `${date} | ${log.location} | ${log.ip} | ${log.userAgent}`
    }).join('\n')

    // Return as text/plain for easy viewing
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: formattedLogs || 'No logs found.'
    }
  } catch (error) {
    console.error('Failed to retrieve logs:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve logs' })
    }
  }
}

export { handler }
