import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function findOneValidByToken(sessionToken) {
  const sessionFound = await runSelectQuery(sessionToken);
  return sessionFound;

  async function runSelectQuery(sessionToken) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
        AND
          expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    if (result.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

async function create(userId) {
  const expiresAt = createExpiresAt();
  const token = createToken();
  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  function createToken() {
    const token = crypto.randomBytes(48);
    return token.toString("hex");
  }

  async function runInsertQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = createExpiresAt();
  const renewedSession = await runUpdateQuery(sessionId, expiresAt);
  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return result.rows[0];
  }
}

function createExpiresAt() {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  return expiresAt;
}

const session = {
  create,
  findOneValidByToken,
  renew,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
