const ADJECTIVES = [
  'agile', 'synergistic', 'disruptive', 'scalable', 'toxic', 
  'endless', 'pointless', 'proactive', 'holistic', 'strategic', 
  'overpriced', 'redundant', 'seamless', 'dynamic', 'aligned', 
  'blocked', 'lean', 'frictionless', 'impactful', 'synergized'
]

const MEETINGS = [
  'sync', 'standup', 'deepdive', 'touchpoint', 'alignment', 
  'circle', 'workshop', 'allhands', 'retro', 'sprint', 
  'townhall', 'brainstorm', 'kickoff', 'checkin', 'synergy', 
  'onboarding', 'huddle', 'catchup', 'session', 'roundtable'
]

const OUTCOMES = [
  'delayed', 'blocked', 'escalated', 'postponed', 'derailed', 
  'ignored', 'rescheduled', 'abandoned', 'crying', 'snoring', 
  'doomed', 'unresolved', 'overtime', 'canceled', 'forgotten'
]

const CATS = [
  'persian', 'sphynx', 'ragdoll', 'bengal', 'mainecoon',
  'siamese', 'munchkin', 'scottishfold', 'savannah', 'burmese'
]

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export async function onRequestPost(context: any) {
  try {
    const data = await context.request.json()
    
    let id = `${pick(ADJECTIVES)}-${pick(MEETINGS)}-${pick(OUTCOMES)}`
    
    // Check if it already exists (collision fallback)
    const existing = await context.env.SHARE_KV.get(id)
    if (existing) {
      id = `${id}-${pick(CATS)}`
      
      // If it STILL exists, append a short random string as ultimate fallback
      const existing2 = await context.env.SHARE_KV.get(id)
      if (existing2) {
        id = `${id}-${Math.random().toString(36).substring(2, 6)}`
      }
    }
    
    // Store in KV with a 24-hour expiration
    await context.env.SHARE_KV.put(id, JSON.stringify(data), { expirationTtl: 86400 })
    
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response('Bad Request', { status: 400 })
  }
}
