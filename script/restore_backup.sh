#!/bin/bash

mysqldump -u root -ppassword utn-db > backup.sql

docker compose -f development.yml up -d db

docker cp backup.sql sistema-ejecucionpresupuestaria-utn-frrq-db-1:/frontend

docker exec -i sistema-ejecucionpresupuestaria-utn-frrq-db-1 mysql -h localhost -u root -ppassword utn-db < backup.sql
