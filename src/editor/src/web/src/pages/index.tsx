import { FunctionComponent } from "react";

const IndexPage: FunctionComponent = () => {
  return (
    <>
      <h1>Fantasy Console</h1>
      <div className="menu">
        <a href="/composer" className="menu__item">
            <span className="title">Composer</span>
        </a>
        <div className="menu__item">Soon&trade;</div>
        <div className="menu__item">Soon&trade;</div>
        <div className="menu__item">Soon&trade;</div>
        <div className="menu__item">Soon&trade;</div>
      </div>
    </>
  );
}

export default IndexPage;
