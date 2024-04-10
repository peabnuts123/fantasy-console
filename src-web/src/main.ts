import * as FantasyConsole from '@engine/fantasy_console';

const somethingButton = document.querySelector("#something-button") as HTMLButtonElement;
somethingButton?.addEventListener('click', () => {
  FantasyConsole.greet();
});
