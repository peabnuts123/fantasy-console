# @polyzone/core

This package contains type definitions for the core API used by scripts in PolyZone. Referencing this package lets your tools know what functionality is available in PolyZone.

For information on using PolyZone, see the [PolyZone docs](https://github.com/peabnuts123/polyzone).

## Installation

Instead of using `npm install`, it is recommended you add the following to your `package.json` manually:

```JSONC
{
  // ...
  "dependencies": {
    // Make sure the version matches your version of PolyZone:
    "@polyzone/core": "polyzone-v0.5.9" // e.g. if you are using PolyZone v0.5.9
  },
  // ...
}
```

Run `npm install` after editing the file. **Make sure you match the version number to your version of PolyZone.**

This is preferred over using `npm install (...)` as npm will resolve the tag `polyzone-v0.5.9` to whatever version is latest at the time and store the dependency with a version range like `^0.5.9-0`. While this range should still work, it may cause problems later.

## Updating

There are 2 scenarios where you will want to update this package:

1. You have updated PolyZone and you need types for the new version.
2. You are still using the same version of PolyZone, but you need to update the types because e.g. there was a bug that has been fixed.

How you update this package depends on which of these scenarios you are in:

### Scenario 1. You have updated PolyZone

If you've update PolyZone, simply change the version string in `package.json`:

```diff
{
  // ...
  "dependencies": {
-   "@polyzone/core": "polyzone-v0.2.8",
+   "@polyzone/core": "polyzone-v0.3.0",
  }
  // ...
}
```

and run `npm install`.

### Scenario 2. You are still using the same version of PolyZone

If there is some issue with this package and it has to be updated - while still using the same version of PolyZone - then (provided you have the package referenced via a tag like `polyzone-v0.2.4` in `package.json`) you should be able to run:

```sh
npm update @polyzone/core
```

to update to the latest version. This should only modify your lockfile (e.g. `package-lock.json`).

## How this package is versioned

This package is versioned in step with PolyZone. That means for PolyZone v0.2.4 this package will also be v0.2.4. However, to support multiple releases (bugfixes etc) of this package per version of PolyZone, a pre-release version number is also included in every release e.g. `0.2.4-0`.

This means for any given version of PolyZone (e.g. `0.2.4`) there will be multiple versions of this package - all of which are "pre-release". There will be no package with the exact version `0.2.4`. For example:

 - `0.2.4-0`
 - `0.2.4-1`
 - `0.2.4-2`
 - `0.2.4-3`
 - etc.

You should use whatever is latest, matching the version of PolyZone you are using.

For convenience, a tag is provided for each version of PolyZone in the format of `polyzone-v1.2.3` (e.g. for PolyZone v1.2.3). It is recommended you install this package by using this tag in `package.json` (see [Installation](#installation)). If you install the package through `npm install (...)`
the dependency will be saved with a version range like `^1.2.3-1` (or whatever version is latest at the time). This should still work, but may cause issues later.
