/* ==========================================================================
   GOLDEN HALL - ENVIO DE E-MAIL (recuperação de senha e lembrete de avaliação)
   Usa o Gmail como servidor de envio, autenticado com uma "senha de app"
   (não é a senha normal da conta - ver instruções no .env.example) através
   do pacote nodemailer.
   ========================================================================== */

const nodemailer = require('nodemailer');

const transportador = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USUARIO,
        pass: process.env.EMAIL_SENHA_APP
    }
});

// Manda o e-mail com o link de redefinição de senha. "linkRedefinicao" já
// vem pronto (com o token dentro da URL) de quem chamar essa função.
function enviarEmailRecuperacao(destinatario, linkRedefinicao) {
    return transportador.sendMail({
        from: `"Golden Hall" <${process.env.EMAIL_USUARIO}>`,
        to: destinatario,
        subject: 'Recuperação de senha - Golden Hall',
        html: `
            <div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #d4a437;">Golden Hall</h2>
                <p>Você pediu para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${linkRedefinicao}" style="background: #d4a437; color: #111; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Redefinir minha senha
                    </a>
                </p>
                <p>Esse link vale por 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
            </div>
        `
    });
}

// Manda o lembrete pra avaliar o espaço, depois que a data do evento já
// passou - "linkAvaliacao" leva direto pra "Minhas Reservas", onde o botão
// "Avaliar Espaço" já aparece pra essa reserva específica.
function enviarEmailLembreteAvaliacao(destinatario, nomeCliente, nomeEspaco, linkAvaliacao) {
    return transportador.sendMail({
        from: `"Golden Hall" <${process.env.EMAIL_USUARIO}>`,
        to: destinatario,
        subject: `Como foi seu evento no ${nomeEspaco}?`,
        html: `
            <div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #d4a437;">Golden Hall</h2>
                <p>Olá, ${nomeCliente}!</p>
                <p>Esperamos que seu evento no <strong>${nomeEspaco}</strong> tenha sido incrível. Já que ele aconteceu, que tal contar pra outras pessoas como foi sua experiência?</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${linkAvaliacao}" style="background: #d4a437; color: #111; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Avaliar o espaço
                    </a>
                </p>
                <p>Sua avaliação ajuda outras pessoas a escolherem o espaço certo pro próximo evento delas.</p>
            </div>
        `
    });
}

module.exports = { enviarEmailRecuperacao, enviarEmailLembreteAvaliacao };
