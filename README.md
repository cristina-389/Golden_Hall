# Golden Hall

Site de aluguel de espaços para eventos (salões, chácaras, etc.) - TCC. Conecta clientes que procuram um espaço a proprietários que querem anunciar o deles.

## Estrutura do projeto

```
backend/     - API (Node.js + Express) e banco de dados (SQLite)
frontend/    - Site (HTML, CSS e JavaScript puro, sem framework)
```

O `backend/server.js` serve os dois ao mesmo tempo: a API em `/api/...` e o site em `/frontend/...`, tudo no mesmo endereço (`http://localhost:3000`), pra não dar problema de CORS.

## Como rodar o projeto na sua máquina

1. **Baixe o projeto** (só na primeira vez):
   ```
   git clone https://github.com/cristina-389/Golden_Hall.git
   ```

2. **Instale as dependências do back-end** (só na primeira vez, ou quando o `package.json` mudar):
   ```
   cd backend
   npm install
   ```

3. **Crie o arquivo `.env`** (só na primeira vez - esse arquivo não vem no `git clone` de propósito, porque guarda segredos):
   - Copie o `backend/.env.example` e renomeie a cópia pra `backend/.env`
   - Pode deixar `PORTA=3000` como está
   - Troque o `JWT_SECRET` por qualquer texto aleatório seu (é a "chave secreta" que o servidor usa pra validar quem está logado)

4. **Ligue o servidor** (toda vez que for usar o site):
   ```
   npm start
   ```
   ou, se quiser que ele reinicie sozinho a cada alteração no código do back-end:
   ```
   npm run dev
   ```

5. **Acesse o site** no navegador em:
   ```
   http://localhost:3000/frontend/index.html
   ```
   ⚠️ Não abra o arquivo `index.html` direto pelo navegador (clicando duas vezes) - sem o servidor rodando, a comunicação com a API não funciona.

### Opcional: popular o banco com dados de exemplo

O banco começa vazio. Se quiser ver o site com alguns espaços cadastrados pra testar, rode:
```
npm run seed
```
Isso cria uma conta de proprietário de exemplo (`contato@goldenhall.com` / `golden123`) e 6 espaços de teste. É seguro rodar mais de uma vez - não duplica.

## Divisão do trabalho

- **Front-end**: Cristina
- **Back-end**: João Paulo

Cada um trabalha na sua parte, mas commitem e enviem (`git push`) as mudanças com frequência, em pedaços pequenos - e sempre deem um `git pull` antes de começar a trabalhar, pra puxar o que a outra pessoa já enviou. Isso evita editar em cima de uma versão desatualizada do código.
