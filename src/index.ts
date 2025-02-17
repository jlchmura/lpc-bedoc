import * as lpc from "./parser";
import * as markdown from "./printer/markdown";

export const actions = [
    lpc.action,
    markdown.action,
]

export const contracts = [
  lpc.contract,
  markdown.contract  
];
