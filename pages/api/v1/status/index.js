import database from "infra/database.js";

async function status(_request, response) {
  const result = await database.query("SELECT 1 + 1 as sum;");
  console.log(result.rows)
  response.status(200).json({ message: result });
}

export default status;
