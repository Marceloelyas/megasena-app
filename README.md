# megasena-app
# 🎲 Mega-Sena · Consulta Histórica

Site completo para consultar **todos os resultados já sorteados na Mega-Sena**, com dados oficiais da Caixa Econômica Federal, backend próprio, banco local e HTTPS automático.

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Node](https://img.shields.io/badge/node-20+-green)
![Docker](https://img.shields.io/badge/docker-compose-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-yellow)

---

## 📌 Sobre o projeto

Este projeto nasceu da necessidade de ter uma **consulta rápida e independente** dos resultados da Mega-Sena, sem depender de sites cheios de anúncios ou APIs de terceiros que caem com frequência.

**Principais características:**

- ✅ **Dados oficiais** — extraídos diretamente do Service Bus da Caixa
- ✅ **Backend próprio** — Node.js + Express + SQLite (sem proxies CORS)
- ✅ **Scraper automático** — atualiza o banco a cada 6 horas
- ✅ **HTTPS automático** — Caddy emite e renova certificados sozinho
- ✅ **Totalmente responsivo** — funciona bem em desktop, tablet e celular
- ✅ **Docker-first** — sobe tudo com um comando
- ✅ **Sem anúncios, sem rastreamento, sem cookies**

---

## 🖼️ Funcionalidades

### Consulta
- 🔍 Busca por **número do concurso**
- 📅 Filtro por **ano** e **intervalo de datas**
- 🎯 Filtro por **dezenas** (mostra concursos que contenham **todas** as dezenas selecionadas)
- 📄 Paginação server-side (50 resultados por página)

### Estatísticas
- 📊 **Frequência das dezenas** (heatmap com as 60 dezenas)
- ⏰ **Mais atrasadas** (dezenas que não saem há mais tempo)
- 💰 **Maior prêmio** e **prêmio médio**
- 📈 **Situação do último concurso** (acumulado ou teve ganhador)

### Interface
- 📱 Layout **mobile-first** — cada linha vira um card no celular
- 🌙 Tema escuro com destaque verde (cores da Mega-Sena)
- ⚡ Carregamento rápido (SQLite responde em < 5 ms)
- 🔒 Cabeçalhos de segurança (HSTS, anti-sniffing, etc.)

---

## 🚀 Começando

### Pré-requisitos

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git (opcional) | qualquer | `git --version` |

> **Não precisa** ter Node.js, SQLite ou Caddy instalados no host. Tudo roda em containers.

---

### 📥 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/megasena-app.git
cd megasena-app

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Edite o .env conforme o ambiente
nano .env

Conteúdo do .env para desenvolvimento local:

env
DOMAIN=localhost
ACME_EMAIL=admin@localhost
TZ=America/Sao_Paulo

▶️ Executando

bash
# Sobe tudo (build + start)
make up

# Ou sem Make:
docker compose up -d --build

Na primeira execução, o scraper baixa automaticamente todos os ~3.000 concursos já sorteados. Isso leva de 10 a 20 minutos. Acompanhe com:

bash
make logs
# ou: docker compose logs -f scraper

Você verá algo assim:

text
megasena-scraper  | Buscando último concurso...
megasena-scraper  | Último concurso na Caixa: 2847
megasena-scraper  | Modo FULL — baixando do concurso 1 até 2847
megasena-scraper  |   → 250/2847 (ok:249 err:1)
megasena-scraper  |   → 500/2847 (ok:498 err:2)

Após terminar, acesse:

👉 https://localhost

⚠️ Vai aparecer aviso de certificado self-signed — é esperado em localhost. Clique em "Avançado" → "Continuar mesmo assim".

📁 Estrutura do projeto
text
megasena-app/
├── docker-compose.yml     # Orquestração (Caddy + web + scraper)
├── Dockerfile             # Imagem Node.js + better-sqlite3
├── Caddyfile              # Configuração do reverse proxy + HTTPS
├── Makefile               # Atalhos (make up, make logs, etc.)
├── package.json           # Dependências Node
├── .env                   # Variáveis de ambiente (não versionado)
├── .env.example           # Template do .env
├── .dockerignore          # Exclusões do build
├── .gitignore             # Exclusões do Git
├── db.js                  # Conexão + schema SQLite
├── scraper.js             # Baixa os resultados da Caixa
├── server.js              # API Express + servidor estático
├── public/
│   └── index.html         # Frontend (HTML + CSS + JS inline)
├── data/                  # Banco SQLite (criado automaticamente)
│   └── mega.db
└── backups/               # Backups manuais (make backup)

#### 🛠️ Comandos disponíveis

Comando	Descrição
make up	          Sobe tudo (build + start)
make down	        Derruba containers (mantém dados)
make logs	        Acompanha logs de todos os serviços
make rebuild	    Reconstrói imagens e reinicia
make scrape	      Força scrape incremental agora
make scrape-full	Força baixar todo o histórico de novo
make backup	      Copia data/mega.db para backups/
make shell	      Entra no container web (SSH-like)
make clean	      ⚠️ Apaga containers e volumes (perde dados)

### 🔌 API
O backend expõe os seguintes endpoints (todos GET, retornam JSON):

Endpoint	        Descrição	                  Exemplo
/api/stats	      Estatísticas gerais	        GET /api/stats
/api/ultimo	      Último concurso	            GET /api/ultimo
/api/anos	        Anos disponíveis	          GET /api/anos
/api/frequencia	  Frequência das dezenas	    GET /api/frequencia
/api/atraso	      Dezenas mais atrasadas	    GET /api/atraso
/api/concursos	  Busca paginada com filtros	GET /api/concursos?ano=2024&dezenas=05,12&pagina=1

### Parâmetros de /api/concursos
Parâmetro	        Tipo	        Descrição
concurso	        inteiro	      Nº exato do concurso
ano	              string	      Ano (2024)
de	              data ISO	    Data inicial (2024-01-01)
ate	              data ISO	    Data final (2024-12-31)
dezenas	          CSV	          Dezenas (todas devem estar presentes): 05,12,23
pagina	          inteiro	      Página (default: 1)
limite	          inteiro	      Itens por página (default: 50)

## Exemplo de resposta

json

{
  "total": 2847,
  "pagina": 1,
  "limite": 50,
  "paginas": 57,
  "itens": [
    {
      "concurso": 2847,
      "data": "2026-10-17",
      "dezenas": ["05", "12", "23", "34", "45", "56"],
      "acumulado": false,
      "ganhadores": 2,
      "premio": 45000000,
      "estimativa": 0
    }
  ]
}

### 🌍 Deploy em produção

## 1. Aponte o DNS
Configure um registro A no seu provedor de domínio:

text
seu-dominio.com.br  →  IP_DO_SERVIDOR

Aguarde a propagação (verifique com dig seu-dominio.com.br).

## 2. Configure o .env

env

DOMAIN=seu-dominio.com.br
ACME_EMAIL=voce@seu-dominio.com.br
TZ=America/Sao_Paulo

## 3. Abra as portas no firewall

bash

sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (redireciona + desafio ACME)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 443/udp    # HTTP/3 (opcional)
sudo ufw enable

4. Suba tudo
bash
make up
5. Verifique o certificado
bash
docker compose logs -f caddy
# Em ~30s: {"level":"info","msg":"certificate obtained successfully"}
Pronto — https://seu-dominio.com.br com certificado válido e renovação automática.

### 🧪 Verificação de saúde
Verificação rápida
bash
docker compose ps
Esperado: 3 containers Up, sendo megasena-web marcado como (healthy).

Testar a API
bash
# Local (ignora cert self-signed)
curl -k https://localhost/api/stats

# Produção
curl https://seu-dominio.com.br/api/stats
Ver o banco por dentro
bash
docker compose exec web node -e "const db=require('better-sqlite3')('/app/data/mega.db'); console.log(db.prepare('SELECT COUNT(*) AS n, MAX(concurso) AS ultimo FROM concursos').get())"
Ver o progresso do scrape
bash
docker compose logs -f scraper

## 🐛 Solução de problemas
<details> <summary><b>Container web em <code>Restarting</code> ou <code>Exited</code></b></summary>
Veja os logs:

bash
docker compose logs web
Causas comuns:

EACCES: permission denied /app/data → rode sudo chown -R $USER:$USER data/

Cannot find module 'better-sqlite3' → docker compose up -d --build --no-cache web

</details><details> <summary><b>Caddy não emite certificado em produção</b></summary>
bash
docker compose logs caddy | grep -i error
Erro	Solução
no such host	DNS ainda propagando — aguarde 5-30 min
connection refused	Porta 80 bloqueada — sudo ufw allow 80/tcp
too many failed authorizations	Rate limit do Lets Encrypt — aguarde 1h
</details><details> <summary><b>Scraper não baixa nada (banco sempre com <code>0</code>)</b></summary>
bash
docker compose logs --tail=50 scraper
Verifique conectividade do host com a Caixa:

bash
curl -I https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena
Deve retornar HTTP/2 200. Se retornar 403 ou 429, a Caixa está bloqueando — aguarde algumas horas.

</details><details> <summary><b>Site abre mas mostra "Falha ao carregar"</b></summary>
O frontend carregou mas o backend não respondeu. Teste interno:

bash
docker compose exec web wget -qO- http://localhost:3000/api/stats
docker compose exec caddy wget -qO- http://web:3000/api/stats
Se o primeiro funcionar mas o segundo não, os containers não estão na mesma rede.

</details>

## 🔄 Atualização dos dados

O scraper roda automaticamente a cada 6 horas dentro do container megasena-scraper.

A Mega-Sena sorteia 3 vezes por semana (terças, quintas e sábados, às 20h). Em 6 horas, os resultados estão sempre atualizados.

Forçar atualização agora:

bash
make scrape          # incremental (só baixa o que falta)
make scrape-full     # baixa tudo de novo
💾 Backup e restauração
Backup manual
bash
make backup
# Cria: backups/mega-2026-10-20_1430.db
Backup automático (cron)
Adicione ao crontab -e:

cron
0 3 * * * cd /caminho/para/megasena-app && make backup >> logs/backup.log 2>&1
Restaurar
bash
docker compose down
cp backups/mega-2026-10-20_1430.db data/mega.db
make up
Backup dos certificados TLS (produção)
bash
docker run --rm \
  -v megasena-app_caddy_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/caddy-data-$(date +%F).tar.gz -C /data .

## 🏗️ Stack técnica

Camada	Tecnologia	Por quê
Backend	Node.js 20 + Express	Leve, rápido, ecossistema grande
Banco	SQLite (better-sqlite3)	Zero config, arquivo único, rápido para read-heavy
Scraper	node-fetch	Simples, sem Puppeteer/Playwright
Proxy	Caddy 2	HTTPS automático, config mínima
Frontend	HTML + CSS + JS puro	Sem build step, carrega rápido
Container	Docker + Compose	Portável, reproduzível
Fonte	Service Bus da Caixa	Dados oficiais
Por que SQLite e não PostgreSQL?

O volume de dados é pequeno (~3.000 concursos × 6 dezenas = 18.000 linhas), o uso é read-only (só escreve 3× por semana após cada sorteio), e o backup é trivial (copiar um arquivo). Migrar para PostgreSQL só faria sentido se o projeto crescer para múltiplos usuários com escrita concorrente.

## 🗺️ Roadmap

☑ Backend com SQLite
☑ Scraper automático a cada 6h
☑ HTTPS com Caddy
☑ Frontend responsivo
☑ Docker + Compose
□ Gráficos com Chart.js (evolução do prêmio, pares vs ímpares)
□ Exportação CSV/PDF dos resultados filtrados
□ PWA instalável (offline-first)
□ Simulador de apostas (checar quantos acertos um jogo teria feito)
□ Comparação entre dezenas (correlação, clusters)
□ Autenticação para histórico pessoal de apostas
□ Notificações por e-mail quando sair resultado

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

bash
# 1. Faça um fork do projeto
# 2. Crie uma branch para sua feature
git checkout -b feature/minha-feature

# 3. Commit suas mudanças
git commit -m "feat: adiciona gráfico de prêmios"

# 4. Push para sua branch
git push origin feature/minha-feature

# 5. Abra um Pull Request
Padrões de commit (Conventional Commits):

feat: nova funcionalidade

fix: correção de bug

docs: alteração na documentação

refactor: refatoração sem mudança funcional

style: formatação, ponto e vírgula, etc.

chore: atualização de dependências

## ⚠️ Avisos legais

Não afiliado à Caixa Econômica Federal. Este é um projeto independente de código aberto.

Dados de uso público. Os resultados da Mega-Sena são informações públicas, divulgadas oficialmente pela Caixa.

Sem fins comerciais. O projeto não vende, não monetiza, não exibe anúncios e não coleta dados dos usuários.

Sem garantia. Os dados são extraídos da API pública da Caixa, que pode mudar a qualquer momento. Use por sua conta e risco.

Jogue com responsabilidade. A Mega-Sena é uma loteria — as chances de ganhar são baixíssimas. Este site é apenas uma ferramenta de consulta histórica.

## 📜 Licença

Distribuído sob a Licença MIT. Veja o arquivo LICENSE para mais informações.

text
MIT License

Copyright (c) 2026 [Seu Nome]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Agradecimentos

Caixa Econômica Federal pela API pública de resultados

Comunidade open source pelas bibliotecas usadas (Express, better-sqlite3, Caddy)

Todos os contribuidores que ajudaram a melhorar este projeto

<div align="center">
🎲 Feito com carinho para quem gosta de conferir os números 🎲

⬆ Voltar ao topo

</div> ```

## 📌 Como usar

Salve o conteúdo como README.md na raiz do projeto:

bash
cd ~/Documentos/Projetos\ MME/megasena-app
nano README.md
# Cole o conteúdo, Ctrl+O, Enter, Ctrl+X

Personalize os pontos que ficaram com placeholder:

Placeholder	          Onde está	                  Substitua por
seu-usuario	          Badge e link do clone	      Seu usuário do GitHub
[Seu Nome]	          Linha do copyright	        Seu nome real
seu-dominio.com.br	  Seção de deploy	            Seu domínio (se já tiver)

Se quiser, adicione também o LICENSE (mesmo texto MIT da seção de licença) num arquivo separado:

bash
# Crie o arquivo LICENSE
nano LICENSE
# Cole o texto MIT, troque [Seu Nome] pelo seu
Faça o commit:

bash
git add README.md LICENSE
git commit -m "docs: adiciona README e licença MIT"
git push

✅ O que o README cobre

📖 Visão geral e funcionalidades

🚀 Quickstart (pré-requisitos, instalação, execução)

📁 Estrutura do projeto

🛠️ Comandos disponíveis

🔌 Documentação da API com exemplos

🌍 Deploy em produção passo a passo

🧪 Verificação de saúde (mesmos comandos que usamos)

🐛 Troubleshooting com detalhes expansíveis

🔄 Atualização e backup de dados

🏗️ Stack técnica com justificativa das escolhas

🗺️ Roadmap com itens futuros

🤝 Guia de contribuição

⚠️ Avisos legais

📜 Licença MIT

🙏 Agradecimentos
