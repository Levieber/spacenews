import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "medium",
});

export default function StatusPage() {
  const { data, error, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <main>
        <h1>Status</h1>
        <p>Carregando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Status</h1>
        <p>Erro ao carregar os status do site</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Status</h1>
      <UpdatedAt data={data} />
      <hr />
      <DatabaseStatus data={data} />
    </main>
  );
}

function UpdatedAt({ data }) {
  return (
    <section>
      <p>Atualizado em: {dateFormatter.format(new Date(data.updated_at))}</p>
    </section>
  );
}

function DatabaseStatus({ data }) {
  return (
    <section>
      <h2>Banco de dados</h2>
      <p>Versão: {data.dependencies.database.version}</p>
      <p>Máximo de conexões: {data.dependencies.database.max_connections}</p>
      <p>Conexões abertas: {data.dependencies.database.opened_connections}</p>
    </section>
  );
}
