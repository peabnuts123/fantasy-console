# PolyZone

PolyZone is a 1990s themed fantasy console for creating, sharing, and playing PS1 and N64 style games.

**The project is very early in development**, but you can use its limited APIs to make and export simple projects. See the [project roadmap](#project-roadmap).

Read [the docs](#documentation) for information on how to use PolyZone.


![Screenshot of user interface split into separate panels. A hierarchy panel of game objects. A 3D view panel showing a truck on a concrete area surrounded by grass with a road running through it, along with a floating white sphere and a hamburger with a dumpster on top of it - the hamburger object is "selected" and surrounded by a wireframe box showing a control to move the object. An inspector panel showing properties of the currently selected object like "name", "position", "rotation", "scale". An assets panel showing a list of folders titled "models", "textures", "scripts".](media/screenshot.png)

## Design philosophy

PolyZone has 3 design pillars:
  - Capture the feeling of playing and creating games in the 1990s
  - Be accessible to everybody, even those who did not experience it at the time
  - Use modern standards to remove the bad parts of retro development

PolyZone is a "fantasy console", which means it aims to capture the experience of using a retro system and playing retro games. It does this through the use of modern development practises - to avoid any of the jank or difficulties of using old software.

PolyZone has 2 primary target audiences:
  - People who already have game development skills and want to work in a constrained / simpler environment
  - People who have no game development experience, and want to make simple games easily

Both demographics are benefited by the system being constrained. If you have prior experience, you can avoid getting bogged down by complexity since the system does not support it. If you have no experience, it's easier to get started since there is less to learn.

## Project roadmap

> PolyZone is very early in development!

PolyZone currently only has a modest list of features. The first phase of development was just creating a working editor. PolyZone as of today looks something like this:

  - Create projects and scenes
  - Automatically import and reload assets on-the-fly
  - Create and edit objects
  - Just-enough built-in components
  - Ability to add custom scripts to objects
  - Just-enough scripting APIs for basic interactivity
  - Ability to export cartridges and play them in a standalone runtime

Notably, here is a list of big-ticket features that are current missing:

  - Audio
  - Animations for 3D models
  - Ability to create new objects at runtime (i.e. Unity prefabs)
  - Ability to switch scenes at runtime
  - Some kind of collision system
  - Period-relevant constraints (e.g. limited memory, slow processor, etc.)
  - UIs

### Next up

Now that the editor is functional, the next phase of work will be focused on adding simple versions of the main features that are currently missing e.g.

  - Object templates
  - 3D animations
  - Audio
  - Collision handling

The exact priority of each piece of work will be influenced by [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) - that is, making simple games in PolyZone. If you use PolyZone to make anything, I'd love to [hear from you](#contact) with any feedback, comments, or praise!

### Long term vision

Eventually, PolyZone will be an all-in-one development environment, much like other fantasy consoles such as PICO-8. That means eventually it will have tools to create, texture and animate 3D models, make music and sound effects, etc.

PolyZone will also be constrained as if it had retro hardware. This will place limits on memory and CPU usage in games, forcing developers to optimise and prioritise what goes into their game. There are also plans to simulate various hardware quirks such as  affine texture mapping, fixed point math operations, bilinear texture filtering, etc. It's not yet known exactly what these constraints will be, or whether they will be enforced (or able to be toggled off).

Games will be exportable into standalone "players" (i.e. not just cartridge files) to be deployed to the web or possibly even desktop (or beyond...) e.g. for publishing to itch.io.

PolyZone will have rebindable controls to tailor for players needs (through some kind of common interface - you won't have to implement this yourself), as well as other accessibility features like input sensitivity, game speed, etc.

PolyZone is intended to eventually be a paid product that will hopefully be able to remain open source. The intention is to have a license similar to [Aseprite's license](https://www.aseprite.org/faq/#if-aseprite-source-code-is-available-how-is-that-you-are-selling-it) which essentially allows you to compile and use the project yourself, or purchase it if you don't want the hassle. There are extremely long-term ideas to potentially offer online services to accompany PolyZone that may require a paid account to access - as they will cost money to host.

My hope is that anybody using the software would be happy to pay a modest sum to support it, and anybody who can't afford to do-so can access it for free. PolyZone will never be a subscription-based or limited-time-license piece of software.

## Building from source

You can easily build and run the PolyZone application from this source code.

### Prerequisites
You will need the following tools installed to compile and run the application:
  - [Node.js](https://nodejs.org/)
    - If possible, install this through [nvm](https://github.com/nvm-sh/nvm)
  - [Rust](https://rustup.rs/)


If you are using `nvm`, run `nvm use` in the project root to switch to the correct version of node.js. Then run `npm install` (also in the project root) to install all the dependencies for every project.

### Running

You can run either the `editor` or `web-player` projects. The other projects are just code libraries. In either of these projects, you can run them with the command `npm start`.

If you want to compile the editor into a standalone executable, you can run `npm run build` in the `src/editor` folder.

## Project structure

This is a monorepo with 5 projects:

 - `Core`
   - The public API of PolyZone, used by scripts in games to manipulate the scene
   - Doesn't contain much implementation, is mostly just type definitions
 - `Runtime`
   - Contains implementations of Core, mostly through [Babylon.js](https://github.com/BabylonJS/Babylon.js)
   - Used to boot cartridge files
 - `Editor`
   - The PolyZone editor application
   - [Tauri](https://github.com/tauri-apps/tauri) application with [next.js](https://github.com/vercel/next.js) frontend
   - Uses `Core` and `Runtime` to implement the Composer
 - `Sample Cartridge`
   - An example project, also useful for working on the `Editor`
 - `Web Player`
   - Web player that uses `Runtime` to boot a cartridge in a browser context
   - It's mostly a demo at this stage

These projects are implemented as npm workspaces, so you can simply run `npm install` from the root directory to install dependencies for all of them.

You can also run commands in every project at once by using the following syntax:

```shell
# Syntax: npm run <command> --workspaces
# e.g.
npm run typecheck --workspaces
```

# Documentation

At some point PolyZone will have a proper documentation site - this is crucial. For now, since the project is still early in development, docs will live here in a minimal form.

## Overview

PolyZone projects consist of a few key concepts:

  - `.pzproj` The actual project file itself which contains references to everything in the project
  - `.pzscene` "Scene" files - think of these as "levels"
  - `assets` Any kind of content for your game e.g. models, textures, sounds, etc.

Below is a hierarchy of how all these concepts fit together:

```
Project
├ Assets
└ Scenes
  └ GameObjects
    ├ GameObjectComponents
    └ GameObjects (children)
      └ ...
```

### Scenes

If you've used Unity before, you already have a pretty good grasp of what scenes are. If you've used Godot before, scenes might be a little unfamiliar.

Scenes are like your game's levels. They generally contain a collection of things like the ground, objects in the world, the player, lights, etc. You might have one scene that represents the inside of a house that the player can walk around in. When the player exits through the door you might show a brief loading screen while you load the "outside" scene.

Scenes are used to split up chunks of your game so only the parts of it that are needed right now are loaded. You could of course make your entire game in one scene but you'd probably run out of memory pretty fast!

Scenes contain a hierarchy of [GameObjects](#gameobjects).

#### GameObjects

GameObjects are the building blocks of your scenes. A GameObject does nothing by itself. Its behaviours are defined by combining together many [GameObjectComponents](#gameobjectcomponents). Each GameObject can have many components added to it.

GameObjects can also have children. Child GameObjects inherit their parents transform, meaning they move, rotate and scale along with their parent. You can use this to your advantage to create larger composite objects from many smaller parts.

#### GameObjectComponents

GameObjectComponents are where all the logic of your game lives. PolyZone has many built in components for typical things common to most games such as:
 - `MeshComponent` Render a 3D model
 - `PointLightComponent` A light that shines in every direction, from a specific point
 - `DirectionalLightComponent` A light that shines in one direction, everywhere simultaneously (e.g. sunlight)

Aside from the built-in components, you can also add your own custom logic to a `ScriptComponent` which is how you make behaviours that are specific to your game. See [Scripting](#scripting) on how to develop scripts for PolyZone.

### Assets

Assets are any kind of media for your game e.g. Models, Textures, Sounds, etc.

PolyZone uses industry-standard types for all of its assets so you can develop them in third-party programs.

As PolyZone is still early in development, support for different file types is limited and many systems (such as animation or audio) are wholly unimplemented (as of 2025/02/16). This also means there are currently no built-in tools for editing any of these assets. The idea is that one day there will be native tools for creating assets, while still allowing the option to create and edit assets in third-party tools.

The current list of supported* file types is:

```
Models / materials:   .obj + .mtl, .fbx, .gltf, .glb, .stl
Scripts:              .ts, .js
Sound:                .ogg, .wav, .mp3
Texture:              .png, .jpg/.jpeg, .bmp, .basis, .dds
```

_*file types that are "supported" may not be useful for anything yet._

You can add assets to your game by simply placing them in a subfolder within your project. PolyZone will automatically scan the files and add them to the project. You can use whatever file structure you like. Changes made to assets while the project is open will also be updated in real-time.

## Scripting

Scripting is key to making your games functional! Scripting in PolyZone is done using the TypeScript / JavaScript ecosystem.

<details>
  <summary>"<em>JavaScript, really!</em> 🙄" - a note on language choice</summary>

  A lot of people have strong opinions about JavaScript, and there are a lot of fair criticisms to make. However, one of PolyZone's [goals](#design-philosophy) is to be accessible to all skill levels. JavaScript is a very beginner-friendly language that allows people to get started quickly.

  Secondly, JavaScript/TypeScript [is one of the biggest ecosystems in the world](https://github.blog/news-insights/octoverse/octoverse-2024/#the-most-popular-programming-languages), which means there is TONNES of pre-existing tooling for developing in this stack. Using a well-supported imperfect tool is more valuable than using a really lovely obscure tool. Support for TypeScript also means that scripting in PolyZone can scale to relatively sophisticated projects, compared to using an untyped language like JavaScript, Python or Lua.

  The third reason that JavaScript is the scripting language of PolyZone is that it is easy to run in a browser context. Meaning people can easily deploy their games on the web for people to play without having to install anything.
</details>
<br/>

You are encouraged to use TypeScript wherever possible, though plain JavaScript is also supported. New projects created in PolyZone come with a pre-built TypeScript setup to get started right away.

**Due to the project's infancy, scripting is still very basic. The APIs available to scripts only allow very simple behaviours like moving and transforming objects.**

### Creating scripts

Scripting is implemented through ScriptComponents attached to objects in a scene. Scripts are assets, so you can reference the same script on many different objects, even in different scenes.

To create a script component, create a script file somewhere (e.g. `scripts/player-controller.ts`) that exports a class that extends from `ScriptComponent`:

```typescript
// scripts/player-controller.ts
import { ScriptComponent } from '@polyzone/core/world';

export default class PlayerController extends ScriptComponent {
  public override init() {
    console.log("Player controller initialising!");
  }
}
```

You then need to attach this script to an object in a scene. Create or click on a GameObject and add a new component to it -> select "Script". In the new `Script` asset reference field, click the box and select your script in the popup (or drag your script asset into the `Script` field from the `Assets` panel down the bottom).

That's it! Now when you run your game, your script will run.

### Capabilities

PolyZone's scripting APIs are still very basic. You are mostly limited to moving, rotating and scaling objects. More capabilities will be added soon (along with better documentation). Here is a quick rundown of some things you can do.

#### `onUpdate()`
Implement `onUpdate(deltaTime: number)` to execute logic on every frame:

```typescript
import { ScriptComponent } from '@polyzone/core/world';

export default class PlayerController extends ScriptComponent {
  public override onUpdate(deltaTime: number) {
    // Your logic here. Called once per frame.
  }
}
```

Use the parameter `deltaTime` to keep your logic framerate-independent.

#### Input

Reading input is done using the `Input` module:

```typescript
import { ScriptComponent } from '@polyzone/core/world';
import { Vector2 } from '@polyzone/core/util';
import { Input, InputButton } from '@polyzone/core/modules/Input';

const MOVE_SPEED_PER_SECOND = 3.0;

export default class PlayerController extends ScriptComponent {
  public override onUpdate(deltaTime: number) {
    const moveDelta = new Vector2(0, 0);

    if (Input.isButtonPressed(InputButton.Right)) moveDelta.x += 1;
    if (Input.isButtonPressed(InputButton.Left)) moveDelta.x -= 1;
    if (Input.isButtonPressed(InputButton.Up)) moveDelta.y += 1;
    if (Input.isButtonPressed(InputButton.Down)) moveDelta.y -= 1;

    // Normalize movement to speed per second
    moveDelta.normalizeSelf().multiplySelf(MOVE_SPEED_PER_SECOND * deltaTime);

    this.gameObject.position.x += moveDelta.x;
    this.gameObject.position.z += moveDelta.y;
  }
}
```

The `Input` module is abstract and does not represent any specific keys or buttons. At some point these will be rebindable, but for now only keyboard is supported, with the following bindings:

```
Input       Keyboard
-----       --------
Up          W
Left        A
Down        S
Right       D
A           Space
Start       Escape

All other inputs are *unbound.
```

<sub>_*okay... they are actually all bound to `tilde ~`. They are not technically "unbound"..._</sub>

#### World query

You can query the world to get references to certain objects or components using the `World` module.

```typescript
import { ScriptComponent, CameraComponent } from '@polyzone/core/world';
import { World } from '@polyzone/core/modules/World';

export default class PlayerController extends ScriptComponent {
  private camera!: CameraComponent;

  public override init(): void {
    this.camera = World.query(({ path }) =>
      path("Main Camera")             // Look up GameObject by name / path
        .component(CameraComponent)   // Get CameraComponent from GameObject
    );
  }
}
```

World query will have different selectors that can be destructured from the first param of the function passed to `World.query()`. Currently `path` is the only selector implemented.

`path` takes in a path of object names. For example `Player/Body/Left leg` would select the object at the path:

```
Player
└ Body
  └ Left leg
```

`World.query()` queries relative to the root of the current scene. However, you can query relative to a specific object by passing a reference to it as the first parameter:

```typescript
import { ScriptComponent } from '@polyzone/core/world';
import { World } from '@polyzone/core/modules/World';

export default class PlayerController extends ScriptComponent {
  public override init(): void {
    // Query relative to `this.gameObject`
    const leftLegGameObject = World.query(this.gameObject, ({ path }) =>
      path('Torso/Left leg')
    );
  }
}
```

# Contact

PolyZone is currently developed by one person: [peabnuts123](https://github.com/peabnuts123). If you want to contact me (for feedback or just to get in touch) you can reach me in the following ways:

  - [Twitter](https://x.com/peabnuts123) (tweet or DM me)
  - [Bluesky](https://bsky.app/profile/peabnuts123.bsky.social) (skeet or DM me)
  - Leave an [issue](https://github.com/peabnuts123/polyzone/issues) here on GitHub
  - Email me? gmail: `peabnuts123`
  - I'm `peabnuts123` everywhere, you can find me I'm sure

