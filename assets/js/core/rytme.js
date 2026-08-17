/**
 * DAGSRYTME
 *
 * Hvornår på dagen måltiderne ligger. Det lyder som pynt, men det afgør noget
 * konkret: en snack hører hjemme i det længste hul mellem to måltider, ikke
 * halvanden time før frokost. Er hullet mellem morgenmad og frokost kort, er
 * formiddagsbrødet mest vane — og så er det de nemmeste kalorier at spare.
 */

export const STANDARD_TIDER = { morgenmad: '08:00', frokost: '12:15', aftensmad: '18:00' };

const tilMin = t => {
  const [h, m] = String(t || '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const tilTekst = min => {
  const m = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
};

/** Timer og minutter som "4 t 15 min". */
export function varighed(min) {
  const t = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (t && m) return `${t} t ${m} min`;
  if (t) return `${t} timer`;
  return `${m} min`;
}

/**
 * Lægger klokkeslæt på dagens måltider. Snacks placeres midt i de længste huller.
 * @param {string[]} slots dagens måltider i rækkefølge, fx ['morgenmad','frokost','aftensmad','snack']
 * @param {object} valg brugerens indstillinger (valg.tider)
 * @returns {Array<{slot:string, tid:string|null}>} i samme rækkefølge som `slots`
 */
export function tiderFor(slots, valg) {
  const t = { ...STANDARD_TIDER, ...(valg?.tider || {}) };
  const faste = ['morgenmad', 'frokost', 'aftensmad']
    .filter(s => slots.includes(s))
    .map(s => ({ slot: s, min: tilMin(t[s]) }))
    .filter(x => x.min != null)
    .sort((a, b) => a.min - b.min);

  const antalSnacks = slots.filter(s => s === 'snack').length;
  const snackTider = [];

  if (antalSnacks && faste.length >= 2) {
    // Find hullerne mellem de faste måltider og læg snacks i de største først.
    const huller = [];
    for (let i = 0; i < faste.length - 1; i++) {
      huller.push({ start: faste[i].min, slut: faste[i + 1].min, laengde: faste[i + 1].min - faste[i].min });
    }
    huller.sort((a, b) => b.laengde - a.laengde);
    for (let i = 0; i < antalSnacks; i++) {
      const h = huller[i % huller.length];
      if (!h) break;
      snackTider.push(h.start + h.laengde / 2);
    }
    snackTider.sort((a, b) => a - b);
  } else if (antalSnacks && faste.length === 1) {
    snackTider.push(faste[0].min + 180);
  }

  let snackNr = 0;
  return slots.map(s => {
    if (s === 'snack') {
      const min = snackTider[snackNr++];
      return { slot: s, tid: min != null ? tilTekst(min) : null };
    }
    const f = faste.find(x => x.slot === s);
    return { slot: s, tid: f ? tilTekst(f.min) : null };
  });
}

/**
 * Er der så kort mellem morgenmad og frokost, at et mellemmåltid formiddag
 * mest er vane? Bruges til at sige det til brugeren i stedet for at gætte.
 */
export function formiddagsvurdering(valg) {
  const t = { ...STANDARD_TIDER, ...(valg?.tider || {}) };
  const morgen = tilMin(t.morgenmad);
  const frokost = tilMin(t.frokost);
  const aften = tilMin(t.aftensmad);
  if (morgen == null || frokost == null) return null;

  const formiddag = frokost - morgen;
  const eftermiddag = aften != null ? aften - frokost : null;

  return {
    formiddag,
    eftermiddag,
    // Under 5 timer: du når ikke at blive rigtig sulten, hvis morgenmaden var
    // stor nok. Over 5 timer: et mellemmåltid gør reel gavn.
    behoverFormiddagsmad: formiddag >= 300,
    stoersteHul: eftermiddag != null && eftermiddag > formiddag ? 'eftermiddag' : 'formiddag',
    snackTid: eftermiddag != null && eftermiddag > formiddag
      ? tilTekst(frokost + eftermiddag / 2)
      : tilTekst(morgen + formiddag / 2)
  };
}
