import Player from "@app/components/player";
import { FunctionComponent, useEffect, useRef } from "react";


// const CARTRIDGE_URL = `/sample-cartridge.pzcart`;
const CARTRIDGE_URL = `/debug.pzcart`;

interface Props { }

const PlayerPage: FunctionComponent<Props> = ({ }) => {
  return <Player cartridge={CARTRIDGE_URL} />
};

export default PlayerPage;
