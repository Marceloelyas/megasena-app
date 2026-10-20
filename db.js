const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Caminho do banco: variável DB_PATH (Docker) ou ./mega.db (local)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'mega.db');

// Garante que a pasta existe (o volume pode estar vazio na 1ª vez)
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');   // mais rápido em container

// ... resto do arquivo igual (CREATE TABLE, upsert, etc.)
db.exec(`
  CREATE TABLE IF NOT EXISTS concursos (
    concurso     INTEGER PRIMARY KEY,
    data         TEXT NOT NULL,
    dezena1      INTEGER NOT NULL,
    dezena2      INTEGER NOT NULL,
    dezena3      INTEGER NOT NULL,
    dezena4      INTEGER NOT NULL,
    dezena5      INTEGER NOT NULL,
    dezena6      INTEGER NOT NULL,
    acumulado    INTEGER NOT NULL DEFAULT 0,
    ganhadores   INTEGER NOT NULL DEFAULT 0,
    premio       REAL    NOT NULL DEFAULT 0,
    estimativa   REAL    NOT NULL DEFAULT 0,
    atualizado   TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_data ON concursos(data);
  CREATE INDEX IF NOT EXISTS idx_dez1 ON concursos(dezena1);
`);

const upsert = db.prepare(`
  INSERT INTO concursos
    (concurso, data, dezena1, dezena2, dezena3, dezena4, dezena5, dezena6,
     acumulado, ganhadores, premio, estimativa, atualizado)
  VALUES
    (@concurso, @data, @dezena1, @dezena2, @dezena3, @dezena4, @dezena5, @dezena6,
     @acumulado, @ganhadores, @premio, @estimativa, CURRENT_TIMESTAMP)
  ON CONFLICT(concurso) DO UPDATE SET
    data=excluded.data,
    dezena1=excluded.dezena1, dezena2=excluded.dezena2,
    dezena3=excluded.dezena3, dezena4=excluded.dezena4,
    dezena5=excluded.dezena5, dezena6=excluded.dezena6,
    acumulado=excluded.acumulado,
    ganhadores=excluded.ganhadores,
    premio=excluded.premio,
    estimativa=excluded.estimativa,
    atualizado=CURRENT_TIMESTAMP
`);

function saveConcurso(raw){
  const dezenas = (raw.listaDezenas || raw.dezenas || []).map(d => Number(d));
  if (dezenas.length < 6) return false;

  const faixa1 = (raw.listaRateioPremio || []).find(f => Number(f.faixa) === 1) || {};
  const acumulado = (raw.acumulado === true ||
                     (typeof raw.acumulado === 'string' && /^s/i.test(raw.acumulado))) ? 1 : 0;

  const iso = toISO(raw.dataApuracao || raw.data || '');

  upsert.run({
    concurso:   Number(raw.numero ?? raw.concurso),
    data:       iso,
    dezena1:    dezenas[0], dezena2: dezenas[1], dezena3: dezenas[2],
    dezena4:    dezenas[3], dezena5: dezenas[4], dezena6: dezenas[5],
    acumulado,
    ganhadores: Number(faixa1.numeroDeGanhadores ?? 0),
    premio:     Number(faixa1.valorPremio ?? 0),
    estimativa: Number(raw.valorEstimadoProximoConcurso ?? 0)
  });
  return true;
}

function toISO(d){
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

function rowToObj(r){
  return {
    concurso: r.concurso,
    data: r.data,
    dezenas: [r.dezena1, r.dezena2, r.dezena3, r.dezena4, r.dezena5, r.dezena6]
              .map(n => String(n).padStart(2,'0')),
    acumulado: !!r.acumulado,
    ganhadores: r.ganhadores,
    premio: r.premio,
    estimativa: r.estimativa
  };
}

module.exports = { db, saveConcurso, rowToObj };
