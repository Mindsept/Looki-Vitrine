const fmtLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDate = (d: Date) => fmtLong.format(d);
export const formatDateShort = (d: Date) => fmtShort.format(d);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
