import crypto from "node:crypto";
import database from "infra/database.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function create(userId) {
  const expiresAt = createExpiresAt();
  const token = await createToken();
  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  function createExpiresAt() {
    const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
    return expiresAt;
  }

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

const session = {
  create,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
