#!/bin/bash

export VAULT_ADDR="https://127.0.0.1:8200"
# export NODE_TLS_REJECT_UNAUTHORIZED=0
export VAULT_ROLE_ID=YOUR_VAULT_ROLE_ID
export VAULT_SECRET_ID=YOUR_VAULT_SECRET_ID
export VAULT_TOKEN=YOUR_VAULT_ROOT_TOKEN

vault operator unseal -tls-skip-verify YOUR_UNSEAL_KEY_1
vault operator unseal -tls-skip-verify YOUR_UNSEAL_KEY_2
vault operator unseal -tls-skip-verify YOUR_UNSEAL_KEY_3
