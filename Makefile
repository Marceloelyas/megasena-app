.PHONY: help up down logs rebuild scrape-full scrape backup clean shell

help:
	@echo "Comandos disponíveis:"
	@echo "  make up            → sobe tudo (build + start)"
	@echo "  make down          → derruba tudo (mantém dados)"
	@echo "  make logs          → acompanha logs"
	@echo "  make rebuild       → reconstrói e sobe"
	@echo "  make scrape-full   → força baixar todo o histórico"
	@echo "  make scrape        → força scrape incremental"
	@echo "  make backup        → salva o banco com data"
	@echo "  make shell         → entra no container web"
	@echo "  make clean         → apaga volumes (CUIDADO)"

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

rebuild:
	docker compose up -d --build --force-recreate

scrape-full:
	docker compose exec scraper node scraper.js --full

scrape:
	docker compose exec scraper node scraper.js

backup:
	@mkdir -p backups
	@cp data/mega.db backups/mega-$$(date +%F_%H%M).db
	@echo "Backup salvo em backups/mega-$$(date +%F_%H%M).db"

shell:
	docker compose exec web sh

clean:
	@read -p "Apagar TODOS os dados (banco + certificados)? [s/N] " r; \
	[ "$$r" = "s" ] && docker compose down -v || echo "Cancelado."
