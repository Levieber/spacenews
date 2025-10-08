import email from "@infra/email.js";

async function sendEmailToUser(user) {
  await email.send({
    from: "SpaceNews <contato@spacenews.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no SpaceNews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no SpaceNews:

https://link.com

Atenciosamente,
Equipe SpaceNews`,
  });
}

const activation = {
  sendEmailToUser,
};

export default activation;
