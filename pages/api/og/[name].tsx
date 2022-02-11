import { NextApiHandler } from "next";
import ReactDOMServer from "react-dom/server";

import { ChromiumBrowser } from "playwright";

const style = `
  body {
    font-family: "Noto Sans Japanese", serif;
  }
`;

const Content: React.VFC<{ screenName: string }> = ({ screenName }) => (
  <html>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: style }}></style>
    </head>
    <body>
      <h1>{screenName}</h1>
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

const handler: NextApiHandler = async (req, res) => {
  const [username] = [req.query.name].flat();

  if (username === undefined) {
    res.status(404).end(`user not found`);
    return;
  }

  const viewport = { width: 1200, height: 630 };

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

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const image = await page.screenshot({ type: "png" });

    res.setHeader(`Content-Type`, "image/png");
    res.end(image);
  } catch (error) {
    console.error(error);
    res.end("Failed to generate og-image");
  } finally {
    await browser?.close();
  }
};

export default handler;
