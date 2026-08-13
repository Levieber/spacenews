import Head from "next/head";
import styles from "./index.module.css";
import { PageLayout, Header, Text } from "@primer/react";

const contentWidthClasses = {
  small: styles.smallContent,
};

export default function DefaultLayout({
  children,
  contentWidth,
  metadata = {},
}) {
  const contentWidthClassName = contentWidthClasses[contentWidth];
  const contentWidthProp = contentWidthClassName
    ? { className: contentWidthClassName }
    : { width: contentWidth };

  return (
    <>
      <Head>
        <title>
          {metadata.title ? `${metadata.title} · SpaceNews` : "SpaceNews"}
        </title>

        {metadata.description && (
          <meta
            name="description"
            content={metadata.description}
          />
        )}
      </Head>

      <Header>
        <Header.Item full>
          <Header.Link href="/">SpaceNews</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/login">Login</Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link href="/register">Cadastrar</Header.Link>
        </Header.Item>
      </Header>
      <PageLayout>
        <PageLayout.Content {...contentWidthProp}>
          {children}
        </PageLayout.Content>
        <PageLayout.Footer divider="line">
          <Text size="small">&copy; {new Date().getFullYear()} SpaceNews</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
