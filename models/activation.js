import { NotFoundError } from "@infra/errors.js";
import database from "@infra/database.js";
import email from "@infra/email.js";
import webServer from "@infra/web-server.js";
import user from "@models/user.js";

const ACTIVATION_TOKEN_ID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneValidById(userId) {
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
          id = $1
        AND
          used_at IS NULL
        AND
          expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [userId],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        action:
          "Verifique se o token de ativação ainda é válido ou se foi informado corretamente.",
        message: "Usuário não possui token de ativação válido.",
      });
    }

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

async function markTokenAsUsed(activationTokenId) {
  const activationToken = await runUpdateQuery(activationTokenId);
  return activationToken;

  async function runUpdateQuery(activationTokenId) {
    const result = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [activationTokenId],
    });

    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
  return activatedUser;
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
  findOneValidById,
  create,
  markTokenAsUsed,
  activateUserByUserId,
  sendEmailToUser,
  ACTIVATION_TOKEN_ID_PATTERN,
};

export default activation;
