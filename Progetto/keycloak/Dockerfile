FROM quay.io/keycloak/keycloak:25.0

LABEL maintainer="Spacehub Admin"
LABEL description="Keycloak ottimizzato per Postgres con tema Spacehub custom"

# Copiamo il tuo tema personalizzato dentro l'immagine
COPY ./keycloak-theme/spacehub /opt/keycloak/themes/spacehub

# Copiamo il pacchetto JAR dalla sottocartella js-policy
COPY ./js-policy/my-js-policy.jar /opt/keycloak/providers/
ENV KC_FEATURES=scripts

# Diciamo a Keycloak di prepararsi a usare esclusivamente Postgres, scartando gli altri driver
ENV KC_DB=postgres

# Disabilitiamo funzioni sperimentali e impostiamo la cache dei temi per la produzione
ENV KC_SPI_THEME_CACHE_THEMES=true
ENV KC_SPI_THEME_CACHE_TEMPLATES=true

# Lanciamo la BUILD di ottimizzazione
RUN /opt/keycloak/bin/kc.sh build