const express = require('express');
const path = require('path');
const { db, rowToObj } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

/* ---------- Endpoints ---------- */

// Último concurso
app.get('/api/ultimo', (req, res) => {
  const r = db.prepare('SELECT * FROM concursos ORDER BY concurso DESC LIMIT 1').get();
  res.json(r ? rowToObj(r) : null);
});

// Estatísticas gerais
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM concursos').get().n;
  const ultimo = db.prepare('SELECT * FROM concursos ORDER BY concurso DESC LIMIT 1').get();
  const media = db.prepare(`
    SELECT AVG(premio) AS media, MAX(premio) AS maior
    FROM concursos WHERE ganhadores > 0
  `).get();

  res.json({
    total,
    ultimo: ultimo ? rowToObj(ultimo) : null,
    premioMedio: media.media || 0,
    maiorPremio: media.maior || 0
  });
});

// Frequência das dezenas
app.get('/api/frequencia', (req, res) => {
  const rows = db.prepare(`
    SELECT d, COUNT(*) AS n FROM (
      SELECT dezena1 AS d FROM concursos UNION ALL
      SELECT dezena2 FROM concursos UNION ALL
      SELECT dezena3 FROM concursos UNION ALL
      SELECT dezena4 FROM concursos UNION ALL
      SELECT dezena5 FROM concursos UNION ALL
      SELECT dezena6 FROM concursos
    ) GROUP BY d ORDER BY n DESC
  `).all();
  res.json(rows);
});

// Dezenas mais atrasadas
app.get('/api/atraso', (req, res) => {
  const ultimo = db.prepare('SELECT MAX(concurso) AS u FROM concursos').get().u || 0;
  const rows = db.prepare(`
    SELECT d, MAX(concurso) AS ultimaVez FROM (
      SELECT dezena1 AS d, concurso FROM concursos UNION ALL
      SELECT dezena2, concurso FROM concursos UNION ALL
      SELECT dezena3, concurso FROM concursos UNION ALL
      SELECT dezena4, concurso FROM concursos UNION ALL
      SELECT dezena5, concurso FROM concursos UNION ALL
      SELECT dezena6, concurso FROM concursos
    ) GROUP BY d
  `).all();
  const atrasos = rows
    .map(r => ({ dezena: String(r.d).padStart(2,'0'), atraso: ultimo - r.ultimaVez }))
    .sort((a,b) => b.atraso - a.atraso)
    .slice(0, 12);
  res.json(atrasos);
});

// Lista de anos disponíveis
app.get('/api/anos', (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT substr(data,1,4) AS ano
    FROM concursos WHERE data <> '' ORDER BY ano DESC
  `).all();
  res.json(rows.map(r => r.ano));
});

// Busca paginada com filtros
// Parâmetros: concurso, ano, de (data inicial), ate (data final),
// dezenas (csv), pagina, limite
app.get('/api/concursos', (req, res) => {
  const { concurso, ano, de, ate, dezenas, pagina = 1, limite = 50 } = req.query;

  const where = [];
  const params = {};

  if (concurso){ where.push('concurso = @concurso'); params.concurso = Number(concurso); }
  if (ano){ where.push("substr(data,1,4) = @ano"); params.ano = String(ano); }
  if (de){ where.push('data >= @de'); params.de = de; }
  if (ate){ where.push('data <= @ate'); params.ate = ate; }

  if (dezenas){
    const dz = String(dezenas).split(',').map(s => Number(s.trim())).filter(n => n >= 1 && n <= 60);
    dz.forEach((n, i) => {
      const key = `d${i}`;
      where.push(`(dezena1=@${key} OR dezena2=@${key} OR dezena3=@${key}
                 OR dezena4=@${key} OR dezena5=@${key} OR dezena6=@${key})`);
      params[key] = n;
    });
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM concursos ${whereSql}`).get(params).n;

  const offset = (Math.max(1, Number(pagina)) - 1) * Number(limite);
  params.limite = Number(limite);
  params.offset = offset;

  const rows = db.prepare(`
    SELECT * FROM concursos ${whereSql}
    ORDER BY concurso DESC
    LIMIT @limite OFFSET @offset
  `).all(params);

  res.json({
    total,
    pagina: Number(pagina),
    limite: Number(limite),
    paginas: Math.ceil(total / Number(limite)),
    itens: rows.map(rowToObj)
  });
});

app.listen(PORT, () => {
  console.log(`🎲 Servidor Mega-Sena em http://localhost:${PORT}`);
});
