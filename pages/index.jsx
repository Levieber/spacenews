import DefaultLayout from "@interface/default-layout";

export default function Home() {
  return (
    <DefaultLayout
      metadata={{
        description: "Software deve ser fácil de usar, e de se construir",
      }}
    >
      <h1>Software deve ser fácil de usar, e de se construir</h1>
    </DefaultLayout>
  );
}
