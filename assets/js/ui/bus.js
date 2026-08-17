/**
 * Lille bindeled mellem visningerne og app-skallen, så en knap dybt nede i en
 * visning kan bede om en gentegning eller et sideskift uden at importere
 * app.js (og dermed lave en cirkulær afhængighed).
 */

let tegnFn = () => {};
let skiftFn = () => {};

export const saetTegner = fn => { tegnFn = fn; };
export const saetSkifter = fn => { skiftFn = fn; };

/** Tegn den aktive visning igen. */
export const tegn = () => tegnFn();

/** Skift til en anden visning. */
export const gaaTil = (side, data) => skiftFn(side, data);
