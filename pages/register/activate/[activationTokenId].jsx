import DefaultLayout from "@interface/default-layout";
import { Banner } from "@primer/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActivateUserPage() {
  const router = useRouter();

  const activationTokenId = router.query.activationTokenId;

  const [activationStatus, setActivationStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!activationTokenId) return;

    sendActivationRequest();

    async function sendActivationRequest() {
      try {
        const response = await fetch(
          `/api/v1/activations/${activationTokenId}`,
          {
            method: "PATCH",
            signal: AbortSignal.timeout(5000),
          },
        );

        const activationResponseBody = await response.json();

        if (response.status === 200) {
          setActivationStatus("success");
          return;
        }

        setActivationStatus("failure");
        setErrorMessage(
          `${activationResponseBody.message} ${activationResponseBody.action}`,
        );
      } catch (error) {
        setActivationStatus("failure");

        if (error.name === "TimeoutError") {
          setErrorMessage(
            "A solicitação demorou para obter uma resposta. Tente novamente mais tarde.",
          );
        } else if (error.name === "AbortError") {
          setErrorMessage("Solicitação cancelada pelo usuário.");
        } else {
          setErrorMessage(
            "Houve uma falha de conexão com o servidor. Tente novamente mais tarde.",
          );
        }
      }
    }
  }, [activationTokenId]);

  return (
    <DefaultLayout
      contentWidth="small"
      metadata={{
        title: "Ativar cadastro",
      }}
    >
      {activationStatus === "loading" && (
        <Banner variant="info">
          <Banner.Title>Verificando token...</Banner.Title>
        </Banner>
      )}

      {activationStatus === "success" && (
        <Banner variant="success">
          <Banner.Title>Cadastro ativado com sucesso!</Banner.Title>
          <Banner.Description>
            Sua conta está ativa e você já pode{" "}
            <a href="/login">fazer o login</a>
          </Banner.Description>
        </Banner>
      )}

      {activationStatus === "failure" && (
        <Banner variant="critical">
          <Banner.Title>Não foi possível ativar seu cadastro.</Banner.Title>
          <Banner.Description>{errorMessage}</Banner.Description>
        </Banner>
      )}
    </DefaultLayout>
  );
}
