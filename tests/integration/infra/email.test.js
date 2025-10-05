import email from "@infra/email.js";
import orchestrator from "@tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    const sender = "<contato@spacenews.com.br>";
    const recipient = "<contato@levieber.com.br>";
    const lastEmailSubject = "Último email enviado";
    const lastEmailBody = "Corpo do último email.";

    await email.send({
      from: sender,
      to: recipient,
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: sender,
      to: recipient,
      subject: lastEmailSubject,
      text: lastEmailBody,
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe(sender);
    expect(lastEmail.recipients[0]).toBe(recipient);
    expect(lastEmail.subject).toBe(lastEmailSubject);
    expect(lastEmail.text).toBe(`${lastEmailBody}\r\n`);
  });
});
