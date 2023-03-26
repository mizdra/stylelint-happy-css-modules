import stylelint, { utils } from 'stylelint';
import { NAMESPACE } from '../constant';
import { isBoolean } from '../util/validateTypes';

const ruleName = `${NAMESPACE}/no-unused-selectors`;

const messages = utils.ruleMessages(ruleName, {
  unused: (selector: string) => `\`${selector}\` is defined but not used.`,
});

export const noUnusedSelectors: stylelint.Rule<boolean> = (primaryOption, _secondaryOptions, _context) => {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, { actual: primaryOption, possible: isBoolean });
    if (!validOptions || !primaryOption) {
      return;
    }
    root.walkRules((rule) => {
      utils.report({
        result,
        ruleName,
        node: rule,
        message: messages.unused(rule.toString()),
      });
    });
  };
};

noUnusedSelectors.ruleName = ruleName;
noUnusedSelectors.messages = messages;
