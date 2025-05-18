import bcrypt from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  const passwordWithPepper = addPepper(password);
  return await bcrypt.hash(passwordWithPepper, rounds);
}

function getNumberOfRounds() {
  const DEVELOPMENT_ROUNDS = 1;
  const PRODUCTION_ROUNDS = 14;

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_ROUNDS
    : DEVELOPMENT_ROUNDS;
}

const PEPPER = process.env.PEPPER || "JALAPEÑO";

function addPepper(password) {
  if (!password) return undefined;

  const halfLength = Math.ceil(PEPPER.length / 2);
  const pepperStart = PEPPER.slice(0, halfLength);
  const pepperEnd = PEPPER.slice(halfLength);
  const passwordWithPepper = pepperStart + password + pepperEnd;
  return passwordWithPepper;
}

async function compare(password, storedPassword) {
  const passwordWithPepper = addPepper(password);
  return await bcrypt.compare(passwordWithPepper, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
