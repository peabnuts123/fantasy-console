// @ts-check

import { FlatCompat } from '@eslint/eslintrc';

// Simple constants for configuring rules
const DISABLED = 'off';
// const WARNING = ['warn'];
const ERROR = 'error';

// Ayyy don't ask me what any of this is, I just copypaste from the internet
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    settings: {
      next: {
        rootDir: 'src/web',
      },
    },
    rules: {
      // @NOTE Leaving these all on, will disable them as they become a problem
      // Rules that are explicitly disabled
      // '@typescript-eslint/no-explicit-any': DISABLED,
      // '@typescript-eslint/no-empty-function': DISABLED,
      // '@typescript-eslint/no-inferrable-types': DISABLED,
      // '@typescript-eslint/no-use-before-define': DISABLED,
      // '@typescript-eslint/no-non-null-assertion': DISABLED,
      // '@typescript-eslint/restrict-template-expressions': DISABLED,
      // '@typescript-eslint/no-unsafe-member-access': DISABLED, // Too restrictive, you need `any` in certain situations
      // '@typescript-eslint/explicit-module-boundary-types': DISABLED, // Too restrictive, you need `any` in certain situations
      // '@typescript-eslint/no-empty-interface': DISABLED, // No, I frequently want empty interfaces that I haven't built yet (e.g. props)
      // 'react/prop-types': DISABLED,
      // 'react-hooks/exhaustive-deps': DISABLED, // Stupid rule, you frequently want to specifically ignore certain dependencies
      // 'react/react-in-jsx-scope': DISABLED, // Nope, we got over this
      // 'import/no-anonymous-default-export': DISABLED, // This will often clash with local variable names, so we opt not to use it
      // '@next/next/no-img-element': DISABLED, // Lol, absolutely not. What a ridiculous rule, tailored to an extremely specific use-case.


      // Rules that are explicitly a warning
      // - none at present -

      // Rules that are explicitly an error
      'eol-last': ERROR,
      'semi': ERROR,
      'comma-dangle': ['error', 'always-multiline'],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_',
      }],
      'react/no-unknown-property': ['error', { ignore: ['class'] }],
      '@typescript-eslint/no-var-requires': ERROR,
      // @NOTE From: https://github.com/Microsoft/TypeScript/issues/14306#issuecomment-552890299
      // 'no-restricted-globals': ['error', ...restrictedGlobals],
      "no-restricted-globals": ["error", "postMessage", "blur", "focus", "close", "frames", "self", "parent", "opener", "top", "length", "closed", "location", "origin", "name", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "customElements", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "screenX", "screenY", "outerWidth", "outerHeight", "devicePixelRatio", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture", "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter", "onpointerleave", "onafterprint", "onbeforeprint", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "performance", "stop", "open", "print", "captureEvents", "releaseEvents", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "createImageBitmap", "scroll", "scrollTo", "scrollBy", "onappinstalled", "onbeforeinstallprompt", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "chrome", "visualViewport", "speechSynthesis", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase"],
    },
  }),
];
export default eslintConfig;
