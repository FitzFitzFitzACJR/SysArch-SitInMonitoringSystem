// The Philippine academic calendar used to name semesters: 1st semester Aug–Dec, 2nd
// semester Jan–May, midyear Jun–Jul. Used by the seed and the legacy importer.

export function academicTermFor(date: Date) {
  const y = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  if (month >= 8) return { name: `1st Semester AY ${y}–${y + 1}`, startsOn: `${y}-08-01`, endsOn: `${y}-12-31` };
  if (month <= 5) return { name: `2nd Semester AY ${y - 1}–${y}`, startsOn: `${y}-01-01`, endsOn: `${y}-05-31` };
  return { name: `Midyear AY ${y - 1}–${y}`, startsOn: `${y}-06-01`, endsOn: `${y}-07-31` };
}
