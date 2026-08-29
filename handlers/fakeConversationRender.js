const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const crypto = require('crypto');

const WIDTH = 900;
const BG = '#313338';
const TEXT = '#dbdee1';
const NAME_DEFAULT = '#f2f3f5';
const TIME_COLOR = '#949ba4';
const BOT_TAG_BG = '#5865f2';
const BOT_TAG_TEXT = '#ffffff';

const PAD_X = 24;
const PAD_TOP = 20;
const PAD_BOTTOM = 20;
const AVATAR = 40;
const AVATAR_GAP = 16;
const NAME_SIZE = 16;
const TIME_SIZE = 12;
const MSG_SIZE = 16;
const LINE_H = 22;
const GROUP_GAP = 20;
const CONT_GAP = 4;

const DEFAULT_STACK = `"gg sans", "Whitney", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;

// In-memory cache of registered user fonts { userId -> familyName | null }.
const fontCache = new Map();
// De-dupe registered families so we don't re-register the same buffer.
const registeredFamilies = new Set();

function formatTime(input, offsetMin = 0) {
  const m = String(input || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return String(input || '');
  let h = parseInt(m[1], 10);
  let mm = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(mm)) return String(input);
  const total = (h * 60 + mm + offsetMin + 24 * 60) % (24 * 60);
  h = Math.floor(total / 60);
  mm = total % 60;
  const isPM = h >= 12;
  h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
}

// Walk any object and collect strings that look like discord font/collectible asset URLs or ids.
function collectFontCandidates(obj, out = [], depth = 0) {
  if (!obj || depth > 6) return out;
  if (typeof obj === 'string') return out;
  if (Array.isArray(obj)) {
    for (const v of obj) collectFontCandidates(v, out, depth + 1);
    return out;
  }
  if (typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k).toLowerCase();
    if (v && typeof v === 'object') {
      // Sub-tree keyed by "font"/"fonts" is the strongest signal.
      if (key === 'font' || key === 'fonts' || key.includes('font')) {
        // Try common shapes: { asset, family, url, sku_id }
        const asset = v.asset || v.file || v.url || v.src;
        const family = v.family || v.name || v.label;
        if (asset || family) out.push({ asset, family, raw: v, keyPath: key });
      }
      collectFontCandidates(v, out, depth + 1);
    } else if (typeof v === 'string' && key.includes('font')) {
      out.push({ asset: v, family: null, raw: v, keyPath: key });
    }
  }
  return out;
}

function buildFontUrls(asset) {
  if (!asset) return [];
  const s = String(asset);
  if (/^https?:\/\//i.test(s)) return [s];
  // Try known discord cdn prefixes for collectible fonts.
  const cleaned = s.replace(/^\/+/, '');
  return [
    `https://cdn.discordapp.com/assets/collectibles/${cleaned}`,
    `https://cdn.discordapp.com/collectibles/${cleaned}`,
    `https://cdn.discordapp.com/assets/fonts/${cleaned}`,
  ];
}

async function fetchBuffer(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    return Buffer.from(ab);
  } catch (_) {
    return null;
  }
}

function safeFamilyName(base, buf) {
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const clean = String(base || 'UserFont').replace(/[^A-Za-z0-9]/g, '').slice(0, 24) || 'UserFont';
  return `${clean}_${hash}`;
}

function tryRegister(buf, base) {
  const family = safeFamilyName(base, buf);
  if (registeredFamilies.has(family)) return family;
  try {
    const ok = GlobalFonts.register(buf, family);
    if (ok !== false) {
      registeredFamilies.add(family);
      return family;
    }
  } catch (_) {}
  return null;
}

async function resolveUserFont(client, userId) {
  if (fontCache.has(userId)) return fontCache.get(userId);
  if (!client || !userId) { fontCache.set(userId, null); return null; }

  let profile = null;
  try {
    if (client.rest && typeof client.rest.get === 'function') {
      profile = await client.rest.get(`/users/${userId}/profile`);
    }
  } catch (_) {}

  if (!profile) { fontCache.set(userId, null); return null; }

  const candidates = collectFontCandidates(profile);
  for (const c of candidates) {
    const urls = buildFontUrls(c.asset);
    for (const u of urls) {
      const buf = await fetchBuffer(u);
      if (!buf || buf.length < 200) continue;
      const family = tryRegister(buf, c.family || 'UserFont');
      if (family) {
        fontCache.set(userId, family);
        return family;
      }
    }
  }

  fontCache.set(userId, null);
  return null;
}

async function resolveProfile(user, guild, opts = {}) {
  const { useUsernames = false, client = null } = opts;
  const out = {
    name: useUsernames ? user.username : (user.globalName || user.username),
    color: NAME_DEFAULT,
    isBot: !!user.bot,
    avatarURL: user.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true }),
    decorationURL: null,
    fontFamily: null,
  };
  try {
    if (typeof user.avatarDecorationURL === 'function') {
      out.decorationURL = user.avatarDecorationURL({ size: 128, forceStatic: true }) || null;
    }
  } catch (_) {}
  if (guild && !useUsernames) {
    try {
      const member = await guild.members.fetch(user.id);
      if (member) {
        out.name = member.displayName || out.name;
        const hex = member.displayHexColor;
        if (hex && hex !== '#000000') out.color = hex;
        out.avatarURL = member.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });
      }
    } catch (_) {}
  } else if (guild && useUsernames) {
    // Still pick up role color / server avatar when forcing usernames.
    try {
      const member = await guild.members.fetch(user.id);
      if (member) {
        const hex = member.displayHexColor;
        if (hex && hex !== '#000000') out.color = hex;
        out.avatarURL = member.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });
      }
    } catch (_) {}
  }

  try {
    out.fontFamily = await resolveUserFont(client, user.id);
  } catch (_) {
    out.fontFamily = null;
  }

  return out;
}

function wrapLine(ctx, line, maxWidth) {
  const words = line.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

function wrapMessage(ctx, content, maxWidth) {
  const raw = String(content).split(/\r?\n/);
  const lines = [];
  for (const l of raw) {
    if (!l) { lines.push(''); continue; }
    for (const w of wrapLine(ctx, l, maxWidth)) lines.push(w);
  }
  return lines;
}

function drawCircleImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

async function safeLoad(url) {
  try {
    if (!url) return null;
    return await loadImage(url);
  } catch (_) {
    return null;
  }
}

function stackFor(family) {
  return family ? `"${family}", ${DEFAULT_STACK}` : DEFAULT_STACK;
}

async function renderConversation({ messages, timeInput, guild }) {
  const groups = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.userId === m.profile.userId) last.items.push(m);
    else groups.push({ userId: m.profile.userId, profile: m.profile, items: [m] });
  }

  for (const g of groups) {
    g.avatar = await safeLoad(g.profile.avatarURL);
    g.decoration = await safeLoad(g.profile.decorationURL);
  }

  const scratch = createCanvas(WIDTH, 10);
  const sctx = scratch.getContext('2d');
  const contentX = PAD_X + AVATAR + AVATAR_GAP;
  const contentMax = WIDTH - contentX - PAD_X;

  let height = PAD_TOP;
  let baseMinutes = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (gi > 0) height += GROUP_GAP;
    height += NAME_SIZE + 6;
    const stack = stackFor(g.profile.fontFamily);
    for (let ii = 0; ii < g.items.length; ii++) {
      const it = g.items[ii];
      sctx.font = `${MSG_SIZE}px ${stack}`;
      it.lines = wrapMessage(sctx, it.content, contentMax);
      if (ii > 0) height += CONT_GAP;
      height += it.lines.length * LINE_H;
    }
  }
  height += PAD_BOTTOM;

  const canvas = createCanvas(WIDTH, Math.max(height, 80));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, canvas.height);
  ctx.textBaseline = 'alphabetic';
  ctx.antialias = 'subpixel';

  let y = PAD_TOP;
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (gi > 0) y += GROUP_GAP;
    const stack = stackFor(g.profile.fontFamily);

    const avatarY = y;
    if (g.avatar) drawCircleImage(ctx, g.avatar, PAD_X, avatarY, AVATAR);
    else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(PAD_X + AVATAR / 2, avatarY + AVATAR / 2, AVATAR / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#4e5058';
      ctx.fill();
      ctx.restore();
    }
    if (g.decoration) {
      const pad = 4;
      ctx.drawImage(g.decoration, PAD_X - pad, avatarY - pad, AVATAR + pad * 2, AVATAR + pad * 2);
    }

    const nameY = y + NAME_SIZE;
    ctx.font = `600 ${NAME_SIZE}px ${stack}`;
    ctx.fillStyle = g.profile.color || NAME_DEFAULT;
    ctx.fillText(g.profile.name, contentX, nameY);
    let cursorX = contentX + ctx.measureText(g.profile.name).width + 8;

    if (g.profile.isBot) {
      const tagText = 'APP';
      ctx.font = `700 10px ${DEFAULT_STACK}`;
      const tw = ctx.measureText(tagText).width;
      const tagW = tw + 10;
      const tagH = 15;
      const tagY = nameY - tagH + 2;
      ctx.fillStyle = BOT_TAG_BG;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(cursorX + r, tagY);
      ctx.lineTo(cursorX + tagW - r, tagY);
      ctx.quadraticCurveTo(cursorX + tagW, tagY, cursorX + tagW, tagY + r);
      ctx.lineTo(cursorX + tagW, tagY + tagH - r);
      ctx.quadraticCurveTo(cursorX + tagW, tagY + tagH, cursorX + tagW - r, tagY + tagH);
      ctx.lineTo(cursorX + r, tagY + tagH);
      ctx.quadraticCurveTo(cursorX, tagY + tagH, cursorX, tagY + tagH - r);
      ctx.lineTo(cursorX, tagY + r);
      ctx.quadraticCurveTo(cursorX, tagY, cursorX + r, tagY);
      ctx.fill();
      ctx.fillStyle = BOT_TAG_TEXT;
      ctx.fillText(tagText, cursorX + 5, tagY + tagH - 4);
      cursorX += tagW + 8;
    }

    const timeStr = `${formatTime(timeInput, baseMinutes)}`;
    baseMinutes += 1;
    ctx.font = `${TIME_SIZE}px ${DEFAULT_STACK}`;
    ctx.fillStyle = TIME_COLOR;
    ctx.fillText(timeStr, cursorX, nameY);

    y += NAME_SIZE + 6;

    for (let ii = 0; ii < g.items.length; ii++) {
      const it = g.items[ii];
      if (ii > 0) y += CONT_GAP;
      ctx.font = `${MSG_SIZE}px ${stack}`;
      ctx.fillStyle = TEXT;
      for (const line of it.lines) {
        y += LINE_H - 6;
        ctx.fillText(line, contentX, y);
        y += 6;
      }
    }
  }

  return canvas.toBuffer('image/png');
}

module.exports = { renderConversation, resolveProfile, formatTime };
