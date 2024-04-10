import * as FantasyConsole from '@engine/fantasy_console';

// @NOTE v8 custom property
// Increase stack trace size for better view of Rust panics
(Error as any).stackTraceLimit = 50;

FantasyConsole.run_gl_demo();
