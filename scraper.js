const fetch = (...a) => import('node-fetch').then(({default:f}) => f(...a));
const { saveConcurso, db } = require('./db');

const BASE = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';
const CONCURRENCIA = 6;

async function fetchConcurso(n){
  const url = n ? `${BASE}/${n}` : BASE;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (MegaSenaApp)' },
    timeout: 15000
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function descobreUltimo(){
  const j = await fetchConcurso(null);
  return Number(j.numero);
}

async function baixarLote(numeros){
  let i = 0, ok = 0, fail = 0;
  const total = numeros.length;

  async function worker(){
    while (i < numeros.length){
      const n = numeros[i++];
      try{
        const raw = await fetchConcurso(n);
        if (saveConcurso(raw)) ok++;
      } catch(e){ fail++; }
      if ((ok+fail) % 25 === 0){
        process.stdout.write(`\r  → ${ok+fail}/${total} (ok:${ok} err:${fail})   `);
      }
      await new Promise(r => setTimeout(r, 80)); // educado com a API
    }
  }
  await Promise.all(Array.from({length: CONCURRENCIA}, worker));
  console.log(`\n  ✓ Lote concluído: ${ok} salvos, ${fail} falhas.`);
}

(async () => {
  const args = process.argv.slice(2);
  const full = args.includes('--full');

  console.log('Buscando último concurso...');
  const ultimo = await descobreUltimo();
  console.log(`Último concurso na Caixa: ${ultimo}`);

  const jaTenho = db.prepare('SELECT COUNT(*) AS n, MAX(concurso) AS max FROM concursos').get();
  console.log(`Banco local: ${jaTenho.n} concursos (último: ${jaTenho.max || '—'})`);

  let inicio;
  if (full || jaTenho.n === 0){
    inicio = 1;
    console.log('Modo FULL — baixando do concurso 1 até ' + ultimo);
  } else {
    inicio = (jaTenho.max || 0) + 1;
    if (inicio > ultimo){ console.log('Nada novo para baixar. 🎉'); process.exit(0); }
    console.log(`Modo incremental — baixando de ${inicio} até ${ultimo}`);
  }

  const numeros = [];
  for (let n = inicio; n <= ultimo; n++) numeros.push(n);

  await baixarLote(numeros);
  process.exit(0);
})();
