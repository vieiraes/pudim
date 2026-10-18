# Análise socrática do Pudim

Método obrigatório sempre que o Pudim investiga algo: teste falhando, bug relatado, cobertura
que caiu, número que não bate, comportamento estranho. Vale para todos os comandos.

O objetivo é chegar à **causa raiz com evidência**, sem culpados e sem achismo. Toda resposta a
uma pergunta é marcada como uma de duas coisas:

- **[evidência]** — veio de um comando executado agora, de um arquivo lido ou do histórico do
  git. Cite o comando, o arquivo e a linha, ou o commit. Copie a saída **exatamente**.
- **[hipótese]** — ainda não foi provada. Toda hipótese precisa de um teste que a confirme ou
  descarte antes da conclusão.

Nenhuma conclusão pode se apoiar em **[hipótese]**.

## Regras de exatidão

- Números sempre exatos, com as casas decimais da fonte: `35,71%`, nunca `36%` ou "cerca de".
- Contagens sempre como fração: "falhou em **7 de 10** execuções", nunca "às vezes" ou "quase sempre".
- Datas e commits exatos: `a1b2c3d, 2026-10-15`, nunca "recentemente".
- Mensagem de erro copiada inteira, sem resumir, no bloco de evidências.
- Se um número não pode ser medido, diga **"não medido"** e por quê. Nunca estime.

## As 6 etapas

### 1. Fato observado

Escreva em uma frase **o que foi visto**, sem interpretação, com a evidência exata:
o comando, a saída relevante copiada e o arquivo/linha do teste.

> "`npx jest src/__tests__/taxa.test.js` falha em `boleto cobra 3,50`:
> `Expected: 3.5 / Received: "3.5"` (taxa.test.js:4)."

### 2. Perguntas socráticas

Responda cada pergunta com **[evidência]** ou **[hipótese]**. Pule só as que não se aplicam,
dizendo por quê.

| Pergunta | Como responder com evidência |
|---|---|
| O que **exatamente** falhou? Esperado × obtido. | Saída do runner, copiada |
| **Reproduz sempre?** | `repetir-teste.sh` com N ≥ 5: "falhou em X de N" |
| **Desde quando?** O que mudou? | `git log -p` do arquivo testado e do teste; `git bisect` se preciso |
| **De onde veio a expectativa** do teste? | Requisito, card, documentação, nome da função. Se não houver fonte, diga |
| O problema está no **produto**, no **teste**, no **ambiente** ou nos **dados**? | Uma prova para cada candidato descartado |
| **Qual a explicação alternativa?** | Ao menos uma hipótese concorrente, com o teste que a descarta |
| **E se levarmos ao extremo?** Valores limite, vazio, nulo, concorrência, fuso horário. | Rodar o caso extremo, não imaginar |

### 3. Cinco porquês

Pergunte "por quê?" a partir do fato até chegar a algo que, se corrigido, impede a repetição.
Cada porquê com **[evidência]**. Pare antes de cinco se a causa raiz já estiver provada.
Busque a causa, não culpados: "a função devolve string porque usa `toFixed`", não "o dev errou".

### 4. Classificação

Exatamente uma, com a evidência que a sustenta:

- **Bug no produto** — o código não faz o que o requisito diz.
- **Bug no teste** — o teste espera algo errado, verifica errado ou depende de ordem/estado.
- **Instável (flaky)** — passa e falha sem mudança de código ("falhou em X de N").
- **Ambiente** — versão, variável, rede, fuso, dependência.
- **Dados** — massa de teste, seed, data fixa vencida.
- **Inconclusivo** — as evidências não bastam. Diga exatamente o que falta medir.

### 5. Consequências

- Quem é afetado e em qual fluxo do produto?
- Qual o risco de **não** corrigir? E o risco da correção?
- Há outros lugares com o mesmo padrão? (`grep` com o padrão, resultado exato)

### 6. Conclusão e próxima ação

- **Causa raiz** em uma frase.
- **Próxima ação**, respeitando os limites do Pudim:
  - Bug no produto: o Pudim **não corrige o código do produto**. Gera o relato do bug
    (passos para reproduzir, esperado × obtido, evidências) para o time de desenvolvimento.
  - Bug no teste: propõe a correção do teste e só aplica com o "ok" do usuário.
  - Instável, ambiente ou dados: propõe a ação (isolar, fixar a data, ajustar a massa) e pede o "ok".

## Formato da resposta ao usuário

Linguagem simples primeiro, detalhes técnicos depois:

```
O que aconteceu: <uma frase simples>
Causa raiz: <uma frase> — classificação: <Bug no produto | Bug no teste | ...>
Certeza: <provado por evidência | inconclusivo: falta medir X>
Próxima ação: <uma frase>

Evidências
  1. <comando> → <saída exata>
  2. ...

Cinco porquês
  1. Por que <fato>? Porque <...> [evidência: ...]
  ...

Hipóteses descartadas
  - <hipótese> — descartada por <evidência>
```
