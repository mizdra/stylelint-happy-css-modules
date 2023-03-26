import { createPlugin } from 'stylelint';
import { rules } from './rules/index.js';

export const NAMESPACE = 'happy-css-modules';

const rulesPlugins = Object.entries(rules).map(([ruleName, rule]) => {
  return createPlugin(`${NAMESPACE}/${ruleName}`, rule);
});

// eslint-disable-next-line import/no-default-export
export default rulesPlugins;
