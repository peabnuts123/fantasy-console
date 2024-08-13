import { FunctionComponent } from "react";
import Link from 'next/link';

const IndexPage: FunctionComponent = () => {
  return (
    <>
      <h1>Fantasy Console</h1>
      <div className="menu">
        <Link href="/composer" className="menu__item">
            <span className="title">Composer</span>
        </Link>
        <Link href="/player" className="menu__item">
            <span className="title">Player</span>
        </Link>
        <div className="menu__item">Soon&trade;</div>
        <div className="menu__item">Soon&trade;</div>
        <div className="menu__item">Soon&trade;</div>
      </div>
    </>
  );
}

export default IndexPage;
