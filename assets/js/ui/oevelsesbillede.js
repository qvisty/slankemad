/**
 * ØVELSESILLUSTRATIONER
 *
 * Simple stregtegninger af hver øvelse, set fra siden. Startpositionen er tegnet
 * svagt, slutpositionen fuldt optrukket, så bevægelsen kan aflæses af billedet
 * alene — det er den del, en tekstbeskrivelse er dårligst til.
 *
 * Tegnet i SVG med `currentColor`, så de virker i både lys og mørk tilstand,
 * skalerer skarpt og ikke kræver et eneste eksternt kald.
 */

const SVG = (indhold, titel) => `<svg viewBox="0 0 200 120" role="img" aria-label="${titel}"
  fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
  <g class="gulv" stroke-width="3" opacity="0.28"><path d="M18 106h164"/></g>
  ${indhold}
</svg>`;

/** Svag streg = udgangsposition, fuld streg = slutposition. */
const start = i => `<g class="start" opacity="0.28">${i}</g>`;

const KROP = 'stroke-width="6.5"';
const LEM = 'stroke-width="5"';
const pil = d => `<g stroke-width="3.2" opacity="0.45">${d}</g>`;

const TEGNINGER = {
  /* Armbøjninger — planke, albuerne bøjes til brystet er tæt på gulvet */
  armboejninger: SVG(`
    ${start(`
      <circle cx="46" cy="48" r="10"/>
      <path d="M56 52 L150 74" ${KROP}/>
      <path d="M62 56 L70 104" ${LEM}/>
      <path d="M150 74 L186 104" ${LEM}/>
    `)}
    <circle cx="42" cy="74" r="10"/>
    <path d="M52 78 L150 92" ${KROP}/>
    <path d="M60 82 L54 100 L74 104" ${LEM}/>
    <path d="M150 92 L186 104" ${LEM}/>
    ${pil('<path d="M26 52 L26 84"/><path d="M20 78 L26 86 L32 78"/>')}
  `, 'Armbøjning: kroppen i én lige linje, sænk brystet mod gulvet og pres op igen'),

  /* Håndvægt row — foroverbøjet med støtte, træk vægten op mod hoften */
  row: SVG(`
    <g opacity="0.45" stroke-width="4"><path d="M104 84 L188 84"/><path d="M112 84 L112 104"/><path d="M180 84 L180 104"/></g>
    <circle cx="50" cy="48" r="10"/>
    <path d="M60 53 L128 66" ${KROP}/>
    <path d="M74 56 L80 84" ${LEM}/>
    <path d="M128 66 L124 104" ${LEM}/>
    <path d="M128 66 L146 104" ${LEM}/>
    ${start(`<path d="M64 58 L60 92" ${LEM}/><g stroke-width="7"><path d="M48 92 h24"/></g>`)}
    <path d="M64 58 L66 74 L88 72" ${LEM}/>
    <g stroke-width="7"><path d="M80 72 h18"/></g>
    ${pil('<path d="M34 92 L34 68"/><path d="M28 74 L34 66 L40 74"/>')}
  `, 'Håndvægt row: ryggen vandret med støtte, træk vægten op mod hoften med albuen tæt på kroppen'),

  /* Glute bridge — liggende på ryg, hoften løftes til lige linje */
  glutebridge: SVG(`
    ${start(`<path d="M52 98 L112 100" ${KROP}/><path d="M112 100 L136 78" ${LEM}/>`)}
    <circle cx="42" cy="96" r="10"/>
    <path d="M52 94 L114 70" ${KROP}/>
    <path d="M114 70 L138 82" ${LEM}/>
    <path d="M138 82 L146 104" ${LEM}/>
    <path d="M140 104 L166 104" stroke-width="7"/>
    ${pil('<path d="M92 96 L92 66"/><path d="M86 72 L92 64 L98 72"/>')}
  `, 'Glute bridge: liggende på ryg med bøjede knæ, løft hoften til en lige linje fra skuldre til knæ'),

  /* Bird dog — på alle fire, modsat arm og ben strækkes ud */
  birddog: SVG(`
    <path d="M74 62 L132 62" ${KROP}/>
    <circle cx="62" cy="56" r="10"/>
    <path d="M74 62 L72 104" ${LEM}/>
    <path d="M132 62 L134 104" ${LEM}/>
    ${start(`<path d="M74 62 L54 90" ${LEM}/><path d="M132 62 L150 88" ${LEM}/>`)}
    <path d="M74 62 L30 46" ${LEM}/>
    <path d="M132 62 L178 46" ${LEM}/>
    ${pil('<path d="M46 84 L34 62"/><path d="M31 70 L33 60 L43 62"/><path d="M156 84 L172 64"/><path d="M163 63 L173 62 L172 72"/>')}
  `, 'Bird dog: på alle fire, stræk modsat arm og ben ud, så kroppen danner en lige linje'),

  /* Sally Up — overkroppen løftes kontrolleret fra gulvet */
  sallyup: SVG(`
    <path d="M112 102 L142 76" ${LEM}/>
    <path d="M142 76 L156 104" ${LEM}/>
    <path d="M150 104 L176 104" stroke-width="7"/>
    ${start(`<circle cx="44" cy="94" r="10"/><path d="M54 96 L112 102" ${KROP}/>`)}
    <circle cx="64" cy="58" r="10"/>
    <path d="M72 66 L112 102" ${KROP}/>
    <path d="M68 72 L92 78" ${LEM}/>
    ${pil('<path d="M36 92 L40 62"/><path d="M34 68 L41 60 L47 66"/>')}
  `, 'Sally Up: liggende på ryg med bøjede knæ, løft overkroppen kontrolleret op og ned')
};

/** Enkle piktogrammer til de træningstyper, der ikke har egne øvelser. */
const TYPE_TEGNINGER = {
  styrke: SVG(`
    <path d="M40 60 L160 60" stroke-width="6"/>
    <path d="M52 40 L52 80"/><path d="M64 32 L64 88"/>
    <path d="M148 40 L148 80"/><path d="M136 32 L136 88"/>
  `, 'Vægtstang'),
  lob: SVG(`
    <circle cx="132" cy="30" r="10"/>
    <path d="M126 44 L104 74 L120 88 L128 106"/>
    <path d="M104 74 L74 84 L58 100"/>
    <path d="M126 50 L152 62 L166 54"/>
    <path d="M120 56 L92 50"/>
  `, 'Løber'),
  interval: SVG(`
    <path d="M22 88 L58 88 L58 44 L94 44 L94 88 L130 88 L130 34 L166 34 L166 88" stroke-width="5"/>
  `, 'Intervaller: vekslende høj og lav intensitet'),
  restitution: SVG(`
    <circle cx="70" cy="44" r="10"/>
    <path d="M78 52 L104 66 L134 60"/>
    <path d="M104 66 L108 96 L136 100"/>
    <path d="M64 56 L58 84"/>
  `, 'Rolig gang'),
  hjemme: SVG(`
    <path d="M40 62 L100 26 L160 62"/>
    <path d="M56 56 L56 100 L144 100 L144 56"/>
    <path d="M86 100 L86 74 L114 74 L114 100"/>
  `, 'Hjemmetræning')
};

/** @returns {string} SVG for en øvelse, eller tom streng hvis den ikke findes. */
export const oevelsesBillede = id => TEGNINGER[id] || '';

/** @returns {string} SVG for en træningstype. */
export const typeBillede = type => TYPE_TEGNINGER[type] || '';
