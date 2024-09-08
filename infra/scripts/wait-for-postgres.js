const { exec } = require("child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(_, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    console.log("\n🟢 Postgres está pronto para aceitar conexões");
  }
}

process.stdout.write("\n\n🟡 Aguardando o Postgres aceitar conexão");
checkPostgres();
