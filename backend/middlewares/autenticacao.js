/* ==========================================================================
   GOLDEN HALL - MIDDLEWARE DE AUTENTICAÇÃO
   Um "middleware" é uma função que roda NO MEIO DO CAMINHO, entre o pedido
   chegar no servidor e ele chegar na rota de verdade. Serve pra fazer uma
   checagem que várias rotas precisam repetir - aqui, conferir se a pessoa
   está logada, olhando o token que ela manda.

   Como usar: em vez de "router.post('/espacos', minhaFuncao)", escrevemos
   "router.post('/espacos', autenticar, minhaFuncao)". O Express roda
   "autenticar" PRIMEIRO; só se ela chamar next() é que "minhaFuncao" roda.
   Se autenticar responder com res.status(401)... a rota nunca é executada.
   ========================================================================== */

const jwt = require('jsonwebtoken');

// Confere se o pedido tem um token válido no cabeçalho "Authorization".
// O front-end precisa mandar esse cabeçalho assim: "Bearer eyJhbGc..."
// (o token que o /api/login ou /api/cadastro devolveram).
function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Você precisa estar logado pra fazer isso.' });
    }

    const token = cabecalho.slice('Bearer '.length);

    try {
        // jwt.verify confere a "assinatura" do token com a mesma chave secreta
        // que usamos pra criar ele (JWT_SECRET). Se alguém tentar inventar um
        // token falso, ou se o token estiver vencido, isso lança um erro.
        const dados = jwt.verify(token, process.env.JWT_SECRET);

        // Guarda quem é o usuário logado pra rota seguinte poder usar
        // (ex: req.usuario.id, req.usuario.tipo)
        req.usuario = dados;
        next();
    } catch (erro) {
        res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' });
    }
}

// Middleware extra: além de estar logado, exige que o tipo da conta seja
// "proprietario". Sempre usado DEPOIS de "autenticar" (que é quem preenche req.usuario).
function exigirProprietario(req, res, next) {
    if (req.usuario.tipo !== 'proprietario') {
        return res.status(403).json({ erro: 'Essa ação é exclusiva de contas de proprietário de espaço.' });
    }
    next();
}

module.exports = { autenticar, exigirProprietario };
