/**
 * Product-line deep links to Famous Smoke Shop, keyed by node slug, then by the
 * exact productLines name in data.js. Values are plain famous-smoke.com URLs;
 * the generator wraps them in the CJ click URL from affiliates.js (?url=...).
 * A line that is missing here (or set to null) stays a plain chip.
 *
 * Verified 2026-10-14 (200, correct line). Not carried online at Famous:
 *   arturo: OpusX, Añejo, Casa Cuba (brick-and-mortar allocations; 404 / no search results).
 */
module.exports = {
  arturo: {
    'Hemingway': 'https://www.famous-smoke.com/brand-arturo-fuente-hemingway',
    'Don Carlos': 'https://www.famous-smoke.com/brand-arturo-fuente-don-carlos',
    'Flor Fina 8-5-8': 'https://www.famous-smoke.com/arturo-fuente-858-natural-cigars-natural-box-of-25',
    'Gran Reserva': 'https://www.famous-smoke.com/brands/arturo-fuente-cigars/arturo-fuente-gran-reserva',
    'OpusX': null,
    'Añejo': null,
    'Casa Cuba': null,
  },
};
