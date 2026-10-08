export async function onRequestPost(context: any) {
  try {
    const data = await context.request.json()
    // Generate a simple 6-character alphanumeric ID
    const id = Math.random().toString(36).substring(2, 8)
    
    // Store in KV with a 24-hour expiration
    await context.env.SHARE_KV.put(id, JSON.stringify(data), { expirationTtl: 86400 })
    
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response('Bad Request', { status: 400 })
  }
}
