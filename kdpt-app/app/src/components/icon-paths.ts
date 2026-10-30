// Filled two-tone icon set shared by the client app and coach portal.
// Each entry is the inner SVG markup for a 24×24 viewBox.
/* eslint-disable */
const st = (d: string, w = 2.4) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const CAL = '<rect x="2.5" y="4.5" width="19" height="17" rx="3.5" opacity=".4"/><path d="M6 4.5h12A3.5 3.5 0 0 1 21.5 8v1.5h-19V8A3.5 3.5 0 0 1 6 4.5z"/><rect x="6.5" y="2" width="2.4" height="5" rx="1.2"/><rect x="15.1" y="2" width="2.4" height="5" rx="1.2"/><rect x="6.5" y="12.5" width="3.4" height="3" rx="1"/><rect x="10.3" y="12.5" width="3.4" height="3" rx="1"/><rect x="14.1" y="12.5" width="3.4" height="3" rx="1"/><rect x="6.5" y="16.5" width="3.4" height="3" rx="1"/>';
const BAR = '<rect x="1.5" y="9" width="2.6" height="6" rx="1.1" opacity=".55"/><rect x="4.3" y="5.5" width="3.8" height="13" rx="1.4"/><rect x="8.1" y="10.8" width="7.8" height="2.4" rx="1" opacity=".55"/><rect x="15.9" y="5.5" width="3.8" height="13" rx="1.4"/><rect x="19.9" y="9" width="2.6" height="6" rx="1.1" opacity=".55"/>';
const HOME = '<path d="M10.6 3.6a2 2 0 0 1 2.8 0l7 6.4c.6.6.2 1.6-.6 1.6H19V19a2 2 0 0 1-2 2h-3v-5a2 2 0 0 0-4 0v5H7a2 2 0 0 1-2-2v-7.4H3.2c-.8 0-1.2-1-.6-1.6z"/>';
const CHAT = '<path d="M12 3c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.8-.1-2.6-.3L5 20.5c-.5.3-1.1-.2-1-.7l.8-3.4C3.7 15 3 13 3 10.7 3 6.4 7 3 12 3z"/>';
const BOLT = '<path d="M13.6 2.3 4.4 13.2c-.5.6 0 1.5.8 1.5H11l-1.3 6.6c-.2.9.9 1.4 1.5.7l9.2-10.9c.5-.6 0-1.5-.8-1.5H14l1.3-6.6c.2-.9-.9-1.4-1.7-.7z"/>';
const PLAY = '<path d="M7 4.6v14.8a1 1 0 0 0 1.5.9l12.2-7.4a1 1 0 0 0 0-1.8L8.5 3.7A1 1 0 0 0 7 4.6z"/>';
const P: Record<string, string> = {
  home: HOME, today: HOME,
  train: BAR, dumbbell: BAR,
  fuel: '<path d="M2.6 11.5h18.8a1 1 0 0 1 1 1.1A10.5 10.5 0 0 1 12 21.5 10.5 10.5 0 0 1 1.6 12.6a1 1 0 0 1 1-1.1z"/><path opacity=".5" d="M12.4 9.6c0-3.6 2.5-6.1 6.6-6.1 0 3.6-2.5 6.1-6.6 6.1zM8 9.8a3 3 0 0 1 3-3v3z"/>',
  progress: '<rect x="3" y="13" width="4.6" height="8" rx="1.4" opacity=".4"/><rect x="9.7" y="8.5" width="4.6" height="12.5" rx="1.4" opacity=".7"/><rect x="16.4" y="3" width="4.6" height="18" rx="1.4"/>',
  community: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0 1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><g opacity=".45"><circle cx="4.8" cy="9.2" r="2.5"/><circle cx="19.2" cy="9.2" r="2.5"/><path d="M.8 17.6a4.4 4.4 0 0 1 6.6-3.5 8 8 0 0 0-2.8 4.4H1.8a1 1 0 0 1-1-.9zM23.2 17.6a4.4 4.4 0 0 0-6.6-3.5 8 8 0 0 1 2.8 4.4h2.8a1 1 0 0 0 1-.9z"/></g>',
  clients: '<circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0 1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><g opacity=".45"><circle cx="17" cy="8.5" r="2.8"/><path d="M17 13a5 5 0 0 1 5 5 1 1 0 0 1-1 1h-3.6a8 8 0 0 0-2.2-5.6A5 5 0 0 1 17 13z"/></g>',
  user: '<circle cx="12" cy="7.5" r="4.5"/><path opacity=".5" d="M3.5 20a8.5 8.5 0 0 1 17 0 1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/>',
  chat: CHAT, messages: CHAT,
  play: PLAY, video: PLAY,
  clock: '<circle cx="12" cy="12" r="9.5" opacity=".35"/>' + st('M12 7v5.2l3.4 2'),
  snooze: '<circle cx="12" cy="13" r="8.5" opacity=".35"/>' + st('M12 9v4.2l2.6 1.6M4.5 3.5l-2 2M19.5 3.5l2 2'),
  layers: '<path opacity=".45" d="m3 14.8 9 4.8 9-4.8-2.9-1.6-6.1 3.2-6.1-3.2z"/><path d="M11.1 3.5a2 2 0 0 1 1.8 0l8 4.3c.8.4.8 1.4 0 1.8l-8 4.3a2 2 0 0 1-1.8 0l-8-4.3c-.8-.4-.8-1.4 0-1.8z"/>',
  swap: st('M4 8h13M13.5 4.5 17 8l-3.5 3.5') + '<g opacity=".5">' + st('M20 16H7M10.5 12.5 7 16l3.5 3.5') + '</g>',
  pain: '<path fill-rule="evenodd" d="M10.3 3.4a2 2 0 0 1 3.4 0l8 13.6A2 2 0 0 1 20 20H4a2 2 0 0 1-1.7-3zM12 8.2a1.2 1.2 0 0 0-1.2 1.3l.3 4.3a.9.9 0 0 0 1.8 0l.3-4.3A1.2 1.2 0 0 0 12 8.2zm0 7.6a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/>',
  check: st('m4.5 12.5 4.8 4.8L19.5 7', 2.8),
  back: st('M15 4.5 7.5 12l7.5 7.5', 2.6),
  right: st('m9 4.5 7.5 7.5L9 19.5', 2.6),
  up: st('M12 19.5v-15M5.5 11 12 4.5 18.5 11', 2.6), arrowup: st('M12 19.5v-15M5.5 11 12 4.5 18.5 11', 2.6),
  down: st('m6 9 6 6 6-6', 2.6),
  equal: st('M5.5 9.5h13M5.5 14.5h13', 2.6),
  close: st('M6 6l12 12M18 6 6 18', 2.6),
  plus: st('M12 5v14M5 12h14', 2.8),
  camera: '<path fill-rule="evenodd" d="M8.6 4.5a1.5 1.5 0 0 1 1.3-.8h4.2c.5 0 1 .3 1.3.8l1.1 2H19a2.5 2.5 0 0 1 2.5 2.5v8.5A2.5 2.5 0 0 1 19 20H5a2.5 2.5 0 0 1-2.5-2.5V9A2.5 2.5 0 0 1 5 6.5h2.5zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><circle cx="12" cy="13" r="2" opacity=".45"/>',
  cal: CAL, schedule: CAL, calup: CAL,
  clip: '<rect x="4" y="3.5" width="16" height="18" rx="3" opacity=".4"/><rect x="8" y="2" width="8" height="4" rx="1.5"/>' + st('m8.5 13.5 2.5 2.5 4.5-5'),
  // KAI's mark: the open arc of the D in the KD logo, with a core.
  spark: st('M12 4.5A7.5 7.5 0 1 1 4.5 12', 2.8) + '<circle cx="12" cy="12" r="2.6"/><circle cx="6" cy="6" r="1.7" opacity=".55"/>',
  pin: '<path fill-rule="evenodd" d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.2 6 11.2 6.7 11.9a1.1 1.1 0 0 0 1.6 0c.7-.7 6.7-6.7 6.7-11.9A7.5 7.5 0 0 0 12 2zm0 4.7a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z"/>',
  info: '<circle cx="12" cy="12" r="9.5" opacity=".3"/>' + st('M12 11v5.5') + '<circle cx="12" cy="7.8" r="1.4"/>',
  trophy: '<path d="M7 3h10v6.5a5 5 0 0 1-10 0z"/><path opacity=".45" d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5 4.5 4.5 0 0 0 7.2 11zM17 5h2.5A1.5 1.5 0 0 1 21 6.5a4.5 4.5 0 0 1-4.2 4.5z"/><rect x="10.8" y="14" width="2.4" height="4"/><rect x="7" y="18" width="10" height="3" rx="1.2"/>',
  flame: '<path opacity=".45" d="M12 22a7.5 7.5 0 0 0 7.5-7.5c0-5-4-7.6-5.3-11.5-.2-.6-1-.8-1.4-.3C11 5 10.6 7 11 8.6 9.6 7.6 8.8 6.3 8.6 5c-.1-.7-1-1-1.5-.5C5.6 6.3 4.5 9.4 4.5 14.5A7.5 7.5 0 0 0 12 22z"/><path d="M12 22a4 4 0 0 0 4-4c0-2.5-2-3.8-2.7-5.8-.1-.4-.6-.5-.9-.2C10.6 14 8 15 8 18a4 4 0 0 0 4 4z"/>',
  bolt: BOLT, automation: BOLT,
  weight: '<path fill-rule="evenodd" d="M8 3h8a2.5 2.5 0 0 1 2.5 2.5v1.7c0 .9-.4 1.7-1 2.3A7.5 7.5 0 1 1 6.5 9.5c-.6-.6-1-1.4-1-2.3V5.5A2.5 2.5 0 0 1 8 3zm0 2.3a.7.7 0 0 0-.7.7v1.1c0 .4.2.7.5.9a7.5 7.5 0 0 1 8.4 0c.3-.2.5-.5.5-.9V6a.7.7 0 0 0-.7-.7z"/>',
  send: '<path d="M3.4 4.2c-.4-.9.5-1.8 1.4-1.4l16.5 7.8c.9.4.9 1.7 0 2.1L4.8 20.6c-.9.4-1.8-.5-1.4-1.4L6.5 12z"/>',
  skip: '<path d="M5 5.2v13.6a1 1 0 0 0 1.6.8l8.6-6.8a1 1 0 0 0 0-1.6L6.6 4.4A1 1 0 0 0 5 5.2z"/><rect x="16.5" y="4" width="2.8" height="16" rx="1.4"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
  bell: '<path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v4.3l-1.7 2.6c-.5.8.1 1.6.9 1.6h14.6c.8 0 1.4-.8.9-1.6l-1.7-2.6V9A6.5 6.5 0 0 0 12 2.5z"/><path opacity=".45" d="M9.2 19h5.6a2.8 2.8 0 0 1-5.6 0z"/>',
  machine: '<rect x="3" y="3" width="6" height="18" rx="2"/><path opacity=".45" d="M9 7h6.5a2 2 0 0 1 1.9 1.4l2.5 8.1A1.9 1.9 0 0 1 18 19H9z"/>',
  body: '<circle cx="12" cy="4.5" r="2.5"/><path d="M5 8.5c0-.8.7-1.5 1.5-1.5h11a1.5 1.5 0 0 1 0 3h-3v4l2 6.5a1.3 1.3 0 0 1-2.5.8L12 15.5l-2 5.8a1.3 1.3 0 0 1-2.5-.8l2-6.5v-4h-3A1.5 1.5 0 0 1 5 8.5z"/>',
  card: '<rect x="2" y="4.5" width="20" height="15" rx="3" opacity=".4"/><rect x="2" y="8" width="20" height="3.2"/><rect x="5" y="14.5" width="5" height="2" rx="1"/>',
  heart: '<path d="M12 21c-.3 0-.6-.1-.8-.3C8.6 18.6 2.5 14.2 2.5 8.9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 2.9c0 5.3-6.1 9.7-8.7 11.8-.2.2-.5.3-.8.3z"/>',
  gear: st('M4 7h9M17 7h3M4 17h3M11 17h9') + '<circle cx="15" cy="7" r="2.6"/><circle cx="9" cy="17" r="2.6"/>',
  megaphone: '<path opacity=".45" d="M7 15h2.5l1.2 4.8a1.3 1.3 0 0 1-2.5.6z"/><path d="M3 10.5A2.5 2.5 0 0 1 5.5 8H9l8.5-4.4c.7-.4 1.5.1 1.5.9v15c0 .8-.8 1.3-1.5.9L9 16H5.5A2.5 2.5 0 0 1 3 13.5z"/><rect x="20.2" y="9.5" width="2" height="5" rx="1" opacity=".45"/>',
  shirt: '<path d="M8.6 3.2 3.8 5.6a1 1 0 0 0-.5 1.2l1.4 3.7a1 1 0 0 0 1.3.6l.9-.4V20a1 1 0 0 0 1 1h8.2a1 1 0 0 0 1-1v-9.3l.9.4a1 1 0 0 0 1.3-.6l1.4-3.7a1 1 0 0 0-.5-1.2l-4.8-2.4a3.5 3.5 0 0 1-6.8 0z"/>',
  moon: '<path d="M20 14.6A8.6 8.6 0 0 1 9.4 4a.7.7 0 0 0-.9-.8A9 9 0 1 0 20.8 15.5a.7.7 0 0 0-.8-.9z"/>',
  sun: '<circle cx="12" cy="12" r="4.6"/><g opacity=".5">' + st('M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5') + '</g>',
  drop: '<path d="M12 2.6c.3 0 .6.1.8.4C14.4 5 19 10.4 19 14.5a7 7 0 0 1-14 0C5 10.4 9.6 5 11.2 3c.2-.3.5-.4.8-.4z"/>',
  programmes: '<rect x="3.5" y="2.5" width="17" height="19" rx="3" opacity=".4"/><rect x="7" y="7" width="10" height="2.4" rx="1.2"/><rect x="7" y="11" width="10" height="2.4" rx="1.2"/><rect x="7" y="15" width="6" height="2.4" rx="1.2"/>',
  library: '<rect x="2" y="4" width="20" height="16" rx="3.5" opacity=".4"/><path d="M10 8.6v6.8a.8.8 0 0 0 1.2.7l5.4-3.4a.8.8 0 0 0 0-1.4l-5.4-3.4a.8.8 0 0 0-1.2.7z"/>',
  film: '<rect x="2" y="5" width="15" height="14" rx="3"/><path opacity=".45" d="M18 10.2 21.6 8c.6-.4 1.4.1 1.4.8v6.4c0 .7-.8 1.2-1.4.8L18 13.8z"/>',
  reply: st('M10 7 5 12l5 5M5 12h9.5a5 5 0 0 1 5 5v1.5'),
  open: st('M14 4h6v6M20 4l-8.5 8.5') + '<path opacity=".4" d="M5 6h6v2H6v10h10v-5h2v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
  trash: '<path opacity=".45" d="M6 7.5h12l-.9 12a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8z"/><path d="M9.5 3.5h5a1 1 0 0 1 1 1V6H20a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2h4.5V4.5a1 1 0 0 1 1-1z"/>',
  wifi: st('M2.5 9a14 14 0 0 1 19 0M5.8 12.6a9.2 9.2 0 0 1 12.4 0M9 16.1a4.5 4.5 0 0 1 6 0') + '<circle cx="12" cy="19.5" r="1.6"/>' + '<g opacity=".9">' + st('M3 3l18 18', 2.4) + '</g>',
  search: '<circle cx="10.5" cy="10.5" r="6.5" opacity=".3"/>' + st('M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.6-4.6')
};
P.checkins = P.clip;
P.payments = P.card;
export const ICONS = P;
export type IconName = keyof typeof P;
