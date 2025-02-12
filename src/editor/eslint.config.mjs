// @ts-check

import { FlatCompat } from '@eslint/eslintrc';

// Simple constants for configuring rules
const DISABLED = 'off';
// const WARNING = 'warn';
const ERROR = 'error';

// Ayyy don't ask me what any of this is, I just copypaste from the internet
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    ignorePatterns: [
      ".next/",
      "dist/",
    ],
    settings: {
      next: {
        rootDir: 'src/web',
      },
    },
    rules: {
      // @NOTE Leaving these all on, will disable them as they become a problem
      // Rules that are explicitly disabled
      '@typescript-eslint/no-explicit-any': DISABLED, // Too restrictive, you need `any` in certain situations
      'react-hooks/exhaustive-deps': DISABLED, // Stupid rule. You often want to specifically ignore certain dependencies.


      // Rules that are explicitly a warning
      // - none at present -

      // Rules that are explicitly an error
      'eol-last': ERROR,
      'semi': ERROR,
      'comma-dangle': ['error', 'always-multiline'],
      '@typescript-eslint/explicit-function-return-type': [ERROR, { allowExpressions: true }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      }],
      'react/no-unknown-property': ['error', { ignore: ['class'] }],
      '@typescript-eslint/no-var-requires': ERROR,
      '@typescript-eslint/no-empty-object-type': [ERROR, { allowInterfaces: 'always' }], // Frequently want empty interfaces that I haven't built yet (e.g. props)
      // @NOTE From: https://github.com/Microsoft/TypeScript/issues/14306#issuecomment-552890299
      // 'no-restricted-globals': ['error', ...restrictedGlobals],
      "no-restricted-globals": ["error", "postMessage", "blur", "focus", "close", "frames", "self", "parent", "opener", "top", "length", "closed", "location", "origin", "name", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "customElements", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "screenX", "screenY", "outerWidth", "outerHeight", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture", "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter", "onpointerleave", "onafterprint", "onbeforeprint", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "stop", "open", "print", "captureEvents", "releaseEvents", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "createImageBitmap", "scroll", "scrollTo", "scrollBy", "onappinstalled", "onbeforeinstallprompt", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "chrome", "visualViewport", "speechSynthesis", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase"],
    },
  }),
];
export default eslintConfig;
