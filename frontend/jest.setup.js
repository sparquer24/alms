// jsdom lacks TextEncoder/TextDecoder, which libraries such as jspdf use on import.
const { TextEncoder, TextDecoder } = require('util');

Object.assign(global, { TextEncoder, TextDecoder });
