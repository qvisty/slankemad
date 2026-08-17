/**
 * Falsk browser og falsk Supabase, så synkroniseringen kan køres i node.
 *
 * Serveren efterligner 0001_skema.sql: unikke nøgler pr. tabel, upsert med
 * `merge-duplicates`, PostgREST' format for timestamptz — og triggeren, der
 * BEVARER klientens `opdateret` i stedet for at overskrive det.
 */

export const BRUGER_ID = '00000000-0000-4000-8000-000000000001';

/** En nøgle, der ligner en rigtig anon-nøgle nok til rollekontrollen. */
export const ANON_NOEGLE = ['x', Buffer.from('{"role":"anon"}').toString('base64url'), 'y'].join('.');

export function shimBrowser() {
  const gem = new Map();
  globalThis.localStorage = {
    getItem: k => (gem.has(k) ? gem.get(k) : null),
    setItem: (k, v) => gem.set(k, String(v)),
    removeItem: k => gem.delete(k),
    clear: () => gem.clear()
  };
  globalThis.location = {
    origin: 'https://eksempel.dk',
    pathname: '/slankemad/',
    search: '',
    hash: ''
  };
  globalThis.history = { replaceState: () => {} };
  return gem;
}

/** PostgREST-format: mikrosekunder og "+00:00" i stedet for "Z". */
export const pgStempel = d => {
  const i = new Date(d).toISOString();
  const ms = i.slice(20, 23);
  return ms === '000' ? `${i.slice(0, 19)}+00:00` : `${i.slice(0, 23)}000+00:00`;
};

const UNIKKE = {
  offentlig_indstillinger: ['bruger'],
  traening_session: ['bruger', 'dato'],
  traening_saet: ['session_id', 'oevelse_id', 'saet_nr'],
  gaatur: ['bruger', 'dato'],
  maaling: ['bruger', 'dato']
};

export function fakeSky() {
  const tabeller = {
    offentlig_indstillinger: [], traening_session: [],
    traening_saet: [], gaatur: [], maaling: []
  };
  const log = [];
  let n = 0;
  let fejlPaa = null;

  const svar = (data, status = 200) => ({
    ok: status < 400, status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  });

  globalThis.fetch = async (url, opt = {}) => {
    const u = new URL(url);
    const metode = opt.method || 'GET';
    const krop = opt.body ? JSON.parse(opt.body) : null;

    if (u.pathname.startsWith('/auth/v1/user')) {
      return svar({ id: BRUGER_ID, email: 'test@eksempel.dk' });
    }
    if (u.pathname.startsWith('/auth/v1/')) return svar({});

    const tabel = u.pathname.replace('/rest/v1/', '');
    log.push({ metode, tabel, sti: u.pathname + u.search, krop });

    const f = fejlPaa?.(metode, tabel, krop);
    if (f) throw f;

    const raekker = tabeller[tabel];
    if (!raekker) return svar({ message: 'ukendt tabel' }, 404);

    const filtre = [...u.searchParams.entries()]
      .filter(([k, v]) => k !== 'select' && k !== 'on_conflict' && String(v).startsWith('eq.'))
      .map(([k, v]) => [k, v.slice(3)]);
    const matcher = r => filtre.every(([k, v]) => String(r[k]) === v);

    if (metode === 'GET') return svar(raekker.filter(matcher));
    if (metode === 'DELETE') { tabeller[tabel] = raekker.filter(r => !matcher(r)); return svar(null, 204); }

    if (metode === 'POST') {
      const ind = Array.isArray(krop) ? krop : [krop];
      const ud = [];
      for (const r of ind) {
        // Triggeren: klientens stempel gælder, og udfyldes kun hvis det mangler.
        const stempel = pgStempel(r.opdateret || new Date());
        const noegler = UNIKKE[tabel];
        const i = raekker.findIndex(x => noegler.every(k => String(x[k]) === String(r[k])));
        if (i >= 0) { raekker[i] = { ...raekker[i], ...r, opdateret: stempel }; ud.push(raekker[i]); }
        else { const ny = { id: `id-${++n}`, ...r, opdateret: stempel }; raekker.push(ny); ud.push(ny); }
      }
      return svar(ud);
    }
    return svar({ message: 'ikke understøttet' }, 400);
  };

  return {
    tabeller, log,
    saetFejl: fn => { fejlPaa = fn; },
    ryd: () => { log.length = 0; },
    saet: (dato) => {
      const s = tabeller.traening_session.find(x => x.dato === dato);
      return tabeller.traening_saet.filter(x => x.session_id === s?.id && !x.slettet);
    }
  };
}

/** Logger ind som en enhed, der selv bad om linket. */
export function logInd(sky) {
  globalThis.location.search = '?login=abc';
  globalThis.location.hash = '#access_token=t&refresh_token=r&expires_at=' + (Math.floor(Date.now() / 1000) + 7200);
  localStorage.setItem('slankemad:sky-nonce', 'abc');
  sky.fangLoginFraUrl();
  globalThis.location.hash = '';
  globalThis.location.search = '';
  return sky.hentBruger();
}
