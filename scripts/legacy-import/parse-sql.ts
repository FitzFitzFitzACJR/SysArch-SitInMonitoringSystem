// Minimal parser for phpMyAdmin/mysqldump INSERT statements. It only needs to read the
// data in the original project's dump, not arbitrary SQL:
//   INSERT INTO `table` (`a`, `b`) VALUES (1, 'x'), (2, NULL);

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

export function parseInserts(sql: string): Map<string, Row[]> {
  const tables = new Map<string, Row[]>();
  const header = /INSERT INTO `([^`]+)` \(([^)]*)\) VALUES\s*/g;
  let match: RegExpExecArray | null;

  while ((match = header.exec(sql))) {
    const table = match[1];
    const columns = match[2].split(",").map((c) => c.trim().replace(/^`|`$/g, ""));
    const { rows, end } = readTuples(sql, header.lastIndex);
    header.lastIndex = end;
    const list = tables.get(table) ?? [];
    for (const values of rows) {
      if (values.length !== columns.length) {
        throw new Error(`${table}: expected ${columns.length} values, got ${values.length}`);
      }
      list.push(Object.fromEntries(columns.map((c, i) => [c, values[i]])));
    }
    tables.set(table, list);
  }
  return tables;
}

/** Reads `(…), (…), …;` starting at `pos`. Handles quoted strings with MySQL escapes. */
function readTuples(sql: string, pos: number): { rows: SqlValue[][]; end: number } {
  const rows: SqlValue[][] = [];
  let i = pos;
  const skipSpace = () => {
    while (i < sql.length && /\s/.test(sql[i])) i++;
  };

  for (;;) {
    skipSpace();
    if (sql[i] !== "(") throw new Error(`Expected "(" at ${i}`);
    i++;
    const values: SqlValue[] = [];
    for (;;) {
      skipSpace();
      if (sql[i] === "'") {
        let s = "";
        i++;
        while (i < sql.length) {
          const ch = sql[i];
          if (ch === "\\") {
            const next = sql[i + 1];
            s += next === "n" ? "\n" : next === "r" ? "\r" : next === "t" ? "\t" : next === "0" ? "\0" : next;
            i += 2;
          } else if (ch === "'" && sql[i + 1] === "'") {
            s += "'";
            i += 2;
          } else if (ch === "'") {
            i++;
            break;
          } else {
            s += ch;
            i++;
          }
        }
        values.push(s);
      } else {
        const m = /^(NULL|-?\d+(?:\.\d+)?)/i.exec(sql.slice(i, i + 40));
        if (!m) throw new Error(`Unexpected value at ${i}: ${sql.slice(i, i + 20)}`);
        values.push(m[1].toUpperCase() === "NULL" ? null : Number(m[1]));
        i += m[1].length;
      }
      skipSpace();
      if (sql[i] === ",") {
        i++;
        continue;
      }
      if (sql[i] === ")") {
        i++;
        break;
      }
      throw new Error(`Expected "," or ")" at ${i}`);
    }
    rows.push(values);
    skipSpace();
    if (sql[i] === ",") {
      i++;
      continue;
    }
    if (sql[i] === ";") return { rows, end: i + 1 };
    throw new Error(`Expected "," or ";" at ${i}`);
  }
}
