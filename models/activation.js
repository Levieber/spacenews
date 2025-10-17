import database from "@infra/database.js";
import email from "@infra/email.js";
import webServer from "@infra/web-server.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneByUserId(userId) {
  const savedToken = await runSelectQuery(userId);
  return savedToken;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
      ;`,
      values: [userId],
    });

    return result.rows[0];
  }
}

async function create(userId) {
  const expiresAt = createExpiresAt();

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return result.rows[0];
  }

  function createExpiresAt() {
    const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
    return expiresAt;
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "SpaceNews <contato@spacenews.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no SpaceNews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no SpaceNews:

${webServer.origin}/register/activate/${activationToken.id}

Atenciosamente,
Equipe SpaceNews`,
  });
}

const activation = {
  findOneByUserId,
  create,
  sendEmailToUser,
};

export default activation;
