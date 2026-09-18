import useSWR from "swr";
import DefaultLayout from "@interface/default-layout";
import { Banner, Heading, Stack } from "@primer/react";
import { Card } from "@primer/react/experimental";

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

  return (
    <DefaultLayout
      contentWidth="medium"
      metadata={{ title: "Status" }}
    >
      <Stack gap="spacious">
        <Heading as="h1">Status</Heading>
        {isLoading && (
          <>
            <p>Carregando...</p>
          </>
        )}
        {error && (
          <>
            <p>Erro ao carregar os status do site</p>
          </>
        )}
        {data && (
          <>
            <DatabaseStatus data={data} />
            <UpdatedAt data={data} />
          </>
        )}
      </Stack>
    </DefaultLayout>
  );
}

function UpdatedAt({ data }) {
  return (
    <Banner
      variant="info"
      layout="compact"
    >
      <Banner.Title>
        Atualizado em: {dateFormatter.format(new Date(data.updated_at))}
      </Banner.Title>
    </Banner>
  );
}

function DatabaseStatus({ data }) {
  const database = data.dependencies.database;
  const openedConnections = database.opened_connections;
  const maxConnections = database.max_connections;
  const version = database.version ?? "-";

  return (
    <Stack>
      <Heading
        as="h2"
        variant="medium"
      >
        Database
      </Heading>
      <Stack direction={{ narrow: "vertical", regular: "horizontal" }}>
        <Stack.Item grow>
          <Card>
            <Card.Heading>Conexões abertas</Card.Heading>
            <Card.Description>{openedConnections}</Card.Description>
            <Card.Metadata>Uso nesse instante</Card.Metadata>
          </Card>
        </Stack.Item>
        <Stack.Item grow>
          <Card>
            <Card.Heading>Conexões máximas</Card.Heading>
            <Card.Description>{maxConnections}</Card.Description>
            <Card.Metadata>Conexões disponíveis</Card.Metadata>
          </Card>
        </Stack.Item>
        <Stack.Item grow>
          <Card>
            <Card.Heading>PostgreSQL</Card.Heading>
            <Card.Description>{version}</Card.Description>
            <Card.Metadata>Versão em execução</Card.Metadata>
          </Card>
        </Stack.Item>
      </Stack>
    </Stack>
  );
}
