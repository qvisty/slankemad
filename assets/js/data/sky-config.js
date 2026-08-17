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

export const skyErOpsat = () => Boolean(SKY.url && SKY.anonNoegle);
