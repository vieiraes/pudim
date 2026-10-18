#!/bin/bash
# Falha nas execuções ímpares e passa nas pares (contador em $1).
c=$(( $(cat "$1" 2>/dev/null || echo 0) + 1 )); echo "$c" > "$1"
[ $((c % 2)) -eq 0 ]
