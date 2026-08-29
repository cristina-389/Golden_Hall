/* ==========================================================================
   GOLDEN HALL - ENVIO DE E-MAIL (recuperação de senha)
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

module.exports = { enviarEmailRecuperacao };
