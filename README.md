# Rede Ritmo — landing page

Landing page estática da campanha de aula experimental grátis. A página cobre a apresentação da campanha e o formulário. O fluxo de automação no n8n é configurado separadamente.

## Visualizar localmente

```bash
python3 -m http.server 8000 --directory dist
```

Abra `http://localhost:8000`.

## Conectar ao n8n

1. Coloque a URL **de produção** do Webhook no campo `webhookUrl` de [`dist/config.js`](dist/config.js). Use um webhook `POST` que aceite JSON.
2. Configure o webhook para responder com status `2xx` quando o pedido for registrado. Para duplicidade, responda `409`; para validação, responda `400` com JSON como `{"message":"E-mail inválido."}`. Uma resposta JSON com `success: false`, `ok: false` ou `status: "error"` também é mostrada como erro.
3. Se a página e o n8n estiverem em domínios diferentes, configure CORS no n8n ou no proxy do webhook para permitir a origem da página, o método `POST` e o cabeçalho `Content-Type`.

O formulário envia:

```json
{
  "nome": "Ana Beatriz",
  "whatsapp": "48999123456",
  "email": "ana@email.com",
  "unidade": "centro",
  "modalidade": "musculação",
  "inicio": "esta-semana",
  "site_url": ""
}
```

Valores de `unidade`: `centro`, `estreito`, `sao-jose`. Valores de `modalidade`: `musculação`, `funcional`, `pilates`, `dança`. Valores de `inicio`: `esta-semana`, `este-mês`, `pesquisando`. O campo `site_url` é a isca contra robôs; o fluxo no n8n deve rejeitar valores não vazios. O frontend remove espaços excedentes do nome, converte o e-mail em minúsculas e deixa somente dígitos no WhatsApp. O n8n também deve validar e padronizar esses dados no servidor.

A página **não simula envio bem-sucedido** sem uma URL configurada. A confirmação aparece apenas após resposta bem-sucedida do webhook.

## Arquivos

- `dist/index.html`: estrutura e conteúdo.
- `dist/styles.css`: design responsivo.
- `dist/script.js`: navegação, validação e envio do formulário.
- `dist/config.js`: URL do webhook.
- `dist/assets/`: imagens otimizadas e favicon.

As imagens da página foram geradas para este projeto. A vista da Ponte Hercílio Luz na imagem principal foi orientada por uma [fotografia de domínio público no Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Floripa_Ponte_Herc%C3%ADlio_Luz.jpg).
