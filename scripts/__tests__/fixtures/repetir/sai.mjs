// Sai com o código pedido: node sai.mjs <código> [mensagem]
if (process.argv[3]) console.log(process.argv[3]);
process.exit(Number(process.argv[2]) || 0);
