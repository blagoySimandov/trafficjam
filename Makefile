.PHONY: help build run stop restart logs shell clean \
	nats-build nats-run nats-stop nats-restart nats-logs nats-clean

############################
##@ Database
############################

IMAGE_NAME = trafficjam-db
DOCKERFILE_PATH = docker/Dockerfile.db
CONTAINER_NAME = trafficjam-db
DB_NAME = trafficjam
DB_USER = admin
DB_PASS = admin
DB_PORT = 5432


build: ## build the database image
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE_PATH) .

conn: ## print the connection string
	@echo "postgresql://$(DB_USER):$(DB_PASS)@localhost:$(DB_PORT)/$(DB_NAME)"

run: ## run the database
	docker run -d \
		--name $(CONTAINER_NAME) \
		-e POSTGRES_DB=$(DB_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASS) \
		-p $(DB_PORT):5432 \
		-v trafficjam_db_data:/var/lib/postgresql/data \
		$(IMAGE_NAME)


stop: ## stop the database
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true


restart: stop run ## restart the database


logs: ## view the logs
	docker logs -f $(CONTAINER_NAME)


shell: ## start the database + get access to the psql shell
	docker exec -it $(CONTAINER_NAME) psql -U $(DB_USER) -d $(DB_NAME)


clean: stop ## nukes the database volume (deletes all data)
	docker volume rm trafficjam_db_data || true

############################
##@ NATS JetStream
############################

NATS_IMAGE = trafficjam-nats
NATS_DOCKERFILE = docker/Dockerfile.nats
NATS_CONTAINER = trafficjam-nats
NATS_PORT = 4222
NATS_MONITOR_PORT = 8222


nats-build: ## build the NATS JetStream image
	docker build -t $(NATS_IMAGE) -f $(NATS_DOCKERFILE) .

nats-run: ## run NATS JetStream
	docker run -d \
		--name $(NATS_CONTAINER) \
		-p $(NATS_PORT):4222 \
		-p $(NATS_MONITOR_PORT):8222 \
		-v trafficjam_nats_data:/data/jetstream \
		$(NATS_IMAGE)

nats-stop: ## stop NATS JetStream
	docker stop $(NATS_CONTAINER) || true
	docker rm $(NATS_CONTAINER) || true

nats-restart: nats-stop nats-run ## restart NATS JetStream

nats-logs: ## view NATS logs
	docker logs -f $(NATS_CONTAINER)

nats-clean: nats-stop ## nukes the NATS data volume
	docker volume rm trafficjam_nats_data || true


help: ## Display this help message
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@grep -E '(##@|##)' $(MAKEFILE_LIST) | grep -v grep | while read -r line; do \
		if [[ $$line =~ ^##@ ]]; then \
			echo ""; \
			echo "$${line####@ }"; \
		elif [[ $$line =~ ^[a-zA-Z_-]+: ]]; then \
			target=$$(echo "$$line" | cut -d':' -f1); \
			comment=$$(echo "$$line" | sed -n 's/.*## *//p'); \
			if [ -n "$$comment" ]; then \
				printf "    \033[32m%-20s\033[0m %s\n" "$$target" "$$comment"; \
			fi \
		fi \
	done
