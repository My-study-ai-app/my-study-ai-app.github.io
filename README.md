# Study AI — servidor do Professor IA

Este serviço fornece respostas de IA em `/api/chat` e áudio em português europeu em `/api/speech`.

## Publicação no Render
- Criar um **Web Service** ligado a este repositório.
- Runtime/Language: **Node** (não Docker).
- Build Command: `npm install`
- Start Command: `npm start`
- Adicionar no painel Environment as variáveis `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE` e `FRONTEND_ORIGIN`.
- Nunca colocar a chave da API no `index.html`, no GitHub ou em mensagens.

O HTML chama o endereço `https://study-ai-professor.onrender.com`. Se o Render atribuir outro endereço, atualiza `API_BASE` no `index.html` para o endereço real do serviço.

A voz é gerada por IA; a pronúncia portuguesa e o timbre podem variar e devem ser testados. O uso da API OpenAI pode ter custos separados da subscrição ChatGPT.
