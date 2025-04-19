import bcrypt from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcrypt.hash(password, rounds);
}

function getNumberOfRounds() {
  const DEVELOPMENT_ROUNDS = 1;
  const PRODUCTION_ROUNDS = 14;

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_ROUNDS
    : DEVELOPMENT_ROUNDS;
}

async function compare(password, storedPassword) {
  return await bcrypt.compare(password, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
