export async function onRequestGet(context: any) {
  const { id } = context.params
  
  try {
    const data = await context.env.SHARE_KV.get(id)
    if (!data) return new Response('Not found', { status: 404 })
    
    return new Response(data, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response('Server Error', { status: 500 })
  }
}
