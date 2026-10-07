/** Identifiants uniques (compteur : déterministe et plus rapide que Math.random().toString()). */
let counter = 0;
export const uid = (prefix = 'e') => `${prefix}${++counter}`;
