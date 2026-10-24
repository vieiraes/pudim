# Possíveis bugs encontrados ao criar E2E

## Taxa do boleto vira texto
Rota: /boleto
Passos: abrir /boleto, informar 250 e emitir
Esperado (fonte: README "Taxas"): a tela mostra a taxa como número 2.5
Obtido: a tela mostra "2.50" e a soma vira "2502.50"
Falhou em 3 de 3
Screenshot: test-results/boleto/test-failed-1.png

## Estorno aceita valor maior que o pago
src/pagamentos/estorno.js:12
Esperado (fonte: regra no card PAG-42): recusar estorno acima do valor pago
Obtido: estorno de 200 sobre pagamento de 100 é aceito
Falhou em 3 de 3
