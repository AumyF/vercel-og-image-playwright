import { NextApiHandler } from "next";
import ReactDOMServer from "react-dom/server";

import { ChromiumBrowser } from "playwright";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
  body {
    font-family: "Noto Sans JP", serif;
  }
`;

const Content: React.VFC<{ screenName: string }> = ({ screenName }) => (
  <html>
    <head>
      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
      <style dangerouslySetInnerHTML={{ __html: style }} />
    </head>
    <body>
      <h1>{screenName}</h1>
      <p>
        社会の各個人及び各機関が、この世界人権宣言を常に念頭に置きながら、加盟国自身の人民の間にも、また、加盟国の管轄下にある地域の人民の間にも、これらの権利と自由との尊重を指導及び教育によって促進すること並びにそれらの普遍的措置によって確保することに努力するように、すべての人民とすべての国とが達成すべき共通の基準として、この人権宣言を公布する。{" "}
      </p>
    </body>
  </html>
);

const constructHtmlString = (displayName: string) => {
  const markup = ReactDOMServer.renderToStaticMarkup(
    <Content screenName={displayName} />
  );
  const html = `<!DOCTYPE html>${markup}`;

  return html;
};

const generateImage = async (
  viewport: { width: number; height: number },
  username: string
): Promise<{ type: "ok"; image: Buffer } | { type: "err"; error: unknown }> => {
  let browser: ChromiumBrowser | undefined;
  try {
    if (process.env.NODE_ENV === "production") {
      // Vercel
      const { launchChromium } = await import("playwright-aws-lambda");
      browser = await launchChromium();
    } else {
      // local dev server
      const { chromium } = await import("playwright");
      browser = await chromium.launch();
    }

    const page = await browser.newPage({ viewport });

    const html = constructHtmlString(username);

    await page.setContent(html, { waitUntil: "networkidle" });

    const image = await page.screenshot({ type: "png" });

    return { type: "ok", image };
  } catch (error) {
    return { type: "err", error };
  } finally {
    await browser?.close();
  }
};

const handler: NextApiHandler = async (req, res) => {
  const [username] = [req.query.name].flat();

  if (username === undefined) {
    res.status(404).end(`user not found`);
    return;
  }

  const viewport = { width: 1200, height: 630 };

  const genrationResult = await generateImage(viewport, username);

  if (genrationResult.type === "err") {
    console.error(genrationResult.error);
    res.status(500).end(`Failed to generate og-image.`);
    return;
  }

  const image = genrationResult.image;
  res
    .setHeader(`Content-Type`, "image/png")
    .setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate")
    .end(image);
};

export default handler;
