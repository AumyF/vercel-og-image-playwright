import { GetStaticProps, NextPage } from "next";
import Head from "next/head";

const OGTest: NextPage = () => {
  return (
    <div>
      <Head>
        <title>OG Image Test Chang</title>
        <meta name="og:title" content="Vercel Next.js OG Image Test Chang" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image:src"
          content={`${process.env.NEXT_PUBLIC_BASE_URL}/api/og/aumy`}
        />
      </Head>
      <h1>OG Image Test Chang!</h1>
    </div>
  );
};

export default OGTest;
