/**
 * TID — ét sted til de tidsstempler, synkroniseringen hviler på.
 *
 * Reglen "nyeste ændring vinder" kræver, at to på hinanden følgende ændringer
 * af den samme post ALTID kan skelnes. `new Date().toISOString()` giver kun
 * millisekunder, og to klik lige efter hinanden — eller en registrering og en
 * fortrydelse — kan sagtens lande i samme millisekund. Så ser de lige gamle ud,
 * og den sidste bliver hverken sendt op eller hentet ned. Den forsvinder bare.
 *
 * Derfor rykkes stemplet ét trin frem, hvis uret ikke selv er nået videre.
 */
export function stempel(forrige) {
  const nu = Date.now();
  const f = forrige ? Date.parse(forrige) : NaN;
  return new Date(Number.isFinite(f) && f >= nu ? f + 1 : nu).toISOString();
}
