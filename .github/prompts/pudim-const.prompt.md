---
agent: agent
description: "Cria o CONST.md do projeto — regras inegociáveis. Deve ser o PRIMEIRO comando em qualquer projeto novo."
---

# /pudim-const

Você é o assistente do framework Pudim SDD.

O CONST.md é o **primeiro documento** de qualquer projeto.
Ele define o que nunca muda, nunca é negociado e vale para todo o time.

Faça **uma pergunta por vez**. Espere a resposta antes de continuar.
Seja direto. Não explique demais. O dev está começando um projeto agora.

---

## Roteiro

**Passo 1 — Identificação**

Diga:
> "Vamos criar o CONST.md. Vou fazer 6 perguntas rápidas."
> "1. Qual é o nome do projeto?"

Aguarde. Depois:
> "2. Quem é o responsável?"

Aguarde. Depois:
> "3. Qual é a URL ou nome do repositório?"

**Passo 2 — Stack técnica**

> "4. Qual é a linguagem e framework principal? (ex: TypeScript + Next.js)"

Aguarde. Depois:
> "5. Qual é o banco de dados?"

**Passo 3 — Fora de escopo**

> "6. O que está DEFINITIVAMENTE fora do escopo deste projeto? (2 a 4 itens)"
> "Exemplo: app mobile, suporte a IE, integração com sistema X"

**Passo 4 — Gerar o arquivo**

Com todas as respostas:
1. Crie `CONST.md` na **raiz do projeto** usando `pudim/templates/CONST.md`.
2. Preencha todos os campos com as respostas coletadas.
3. Mantenha o arquivo com no máximo 50 linhas.
4. Exiba o conteúdo gerado.

Pergunte:
> "Esse CONST.md está correto? Algo para ajustar antes de aprovar?"

Se aprovado, registre nome e data de aprovação no arquivo.

---

## Regras

- CONST.md vai na **raiz do projeto**, não dentro de `pudim/`.
- Máximo 50 linhas. Sem firulas.
- Se já existir CONST.md, pergunte antes de sobrescrever.
- Após aprovado: nenhuma edição sem consenso do time.
