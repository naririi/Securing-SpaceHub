FROM mariadb:10.11

LABEL maintainer="Spacehub Admin"
LABEL description="MariaDB configurato con schema e dati iniziali per Spacehub"

# Tutto ciò che viene messo qui dentro viene eseguito automaticamente SOLO al PRIMO avvio del container.
COPY ./01-scheme.sql /docker-entrypoint-initdb.d/
COPY ./02-init.sql /docker-entrypoint-initdb.d/

# Per sicurezza, assicuriamoci che i file abbiano i permessi corretti (sola lettura per il database)
RUN chmod 644 /docker-entrypoint-initdb.d/*.sql