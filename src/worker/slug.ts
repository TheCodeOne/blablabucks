const ADJECTIVES = [
  'agile',
  'synergistic',
  'disruptive',
  'scalable',
  'toxic',
  'endless',
  'pointless',
  'proactive',
  'holistic',
  'strategic',
  'overpriced',
  'redundant',
  'seamless',
  'dynamic',
  'aligned',
  'blocked',
  'lean',
  'frictionless',
  'impactful',
  'synergized',
]

const MEETINGS = [
  'sync',
  'standup',
  'deepdive',
  'touchpoint',
  'alignment',
  'circle',
  'workshop',
  'allhands',
  'retro',
  'sprint',
  'townhall',
  'brainstorm',
  'kickoff',
  'checkin',
  'synergy',
  'onboarding',
  'huddle',
  'catchup',
  'session',
  'roundtable',
]

const OUTCOMES = [
  'delayed',
  'blocked',
  'escalated',
  'postponed',
  'derailed',
  'ignored',
  'rescheduled',
  'abandoned',
  'crying',
  'snoring',
  'doomed',
  'unresolved',
  'overtime',
  'canceled',
  'forgotten',
]

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

export function generateRoomSlug(): string {
  return `${pick(OUTCOMES)}-${pick(ADJECTIVES)}-${pick(MEETINGS)}`
}
