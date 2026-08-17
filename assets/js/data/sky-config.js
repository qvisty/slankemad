/**
 * Forbindelsen til Supabase.
 *
 * Begge værdier er beregnet til at ligge offentligt i frontend — det er sådan
 * Supabase er skruet sammen. Beskyttelsen ligger i Row Level Security i
 * databasen (se supabase/migrations/0001_skema.sql): uden gyldigt login kan
 * anon-nøglen ikke læse eller skrive en eneste række.
 *
 * Er felterne tomme, kører appen præcis som før — alt bliver i browseren, og
 * synkroniseringen vises slet ikke.
 */
export const SKY = {
  url: '',        // fx https://abcdefghijkl.supabase.co
  anonNoegle: ''  // "anon public"-nøglen fra Project Settings → API
};

/**
 * De to nøgler på Supabase' API-side ligger side om side og ser ens ud. Bliver
 * `service_role` kopieret ind her ved et uheld og pushet til et offentligt
 * repo, er hele databasen åben, og RLS er ligegyldig. Rollen står i nøglen
 * selv, så det kan tjekkes gratis.
 */
function rolle(noegle) {
  try {
    const del = noegle.split('.')[1];
    return JSON.parse(atob(del.replace(/-/g, '+').replace(/_/g, '/'))).role || null;
  } catch { return null; }
}

export function skyErOpsat() {
  if (!SKY.url || !SKY.anonNoegle) return false;
  const r = rolle(SKY.anonNoegle);
  if (r && r !== 'anon') {
    console.error('sky-config.js: nøglen har rollen "%s". Brug "anon public" — aldrig service_role.', r);
    return false;
  }
  return true;
}
