// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';


// Simple constants for configuring rules
const DISABLED = 'off';
const WARNING = 'warn';
const ERROR = 'error';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'dist/',
    ],
    rules: {
      // Rules that are explicitly disabled
      '@typescript-eslint/no-explicit-any': DISABLED, // Too restrictive, you need `any` in certain situations

      // Rules that are explicitly a warning
      '@typescript-eslint/no-unused-vars': [WARNING, {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      }],

      // Rules that are explicitly an error
      'eol-last': ERROR,
      'semi': ERROR,
      'comma-dangle': [ERROR, 'always-multiline'],
      '@typescript-eslint/explicit-function-return-type': [ERROR, { allowExpressions: true }],
      '@typescript-eslint/no-var-requires': ERROR,
      '@typescript-eslint/no-empty-object-type': [ERROR, { allowInterfaces: 'always' }], // Frequently want empty interfaces that I haven't built yet (e.g. props)
      // @NOTE From: https://github.com/Microsoft/TypeScript/issues/14306#issuecomment-552890299
      "no-restricted-globals": [ERROR, "postMessage", "blur", "focus", "close", "frames", "self", "parent", "opener", "top", "length", "closed", "location", "origin", "name", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "customElements", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "screenX", "screenY", "outerWidth", "outerHeight", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture", "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter", "onpointerleave", "onafterprint", "onbeforeprint", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "stop", "open", "print", "captureEvents", "releaseEvents", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "createImageBitmap", "scroll", "scrollTo", "scrollBy", "onappinstalled", "onbeforeinstallprompt", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "chrome", "visualViewport", "speechSynthesis", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase"],
    },
  },
);
