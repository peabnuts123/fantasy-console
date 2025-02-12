import { Html, Head, Main, NextScript } from "next/document";
import { FunctionComponent } from "react";

const Document: FunctionComponent = () => {
  return (
    <Html lang="en" className="h-full overscroll-none">
      <Head />
      <body className="h-full overscroll-none">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};


export default Document;
