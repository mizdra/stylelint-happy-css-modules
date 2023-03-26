import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import { SourceMapConsumer } from 'source-map';
import stylelint, { utils } from 'stylelint';
import { NAMESPACE } from '../constant';
import { isBoolean } from '../util/validateTypes';

const ruleName = `${NAMESPACE}/no-unused-selectors`;

const messages = utils.ruleMessages(ruleName, {
  unused: (selector: string) => `\`${selector}\` is defined but not used.`,
});

export const noUnusedSelectors: stylelint.Rule<boolean> = (primaryOption, _secondaryOptions, _context) => {
  return async (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, { actual: primaryOption, possible: isBoolean });
    if (!validOptions || !primaryOption) {
      return;
    }

    if (root.source?.input.file === undefined) return;

    const cssFilePath = root.source.input.file;
    const dtsFilePath = `${cssFilePath}.d.ts`;
    const sourceMapFilePath = `${dtsFilePath}.map`;

    const sourceMapContent = await readFile(sourceMapFilePath, 'utf-8');
    const smc = await new SourceMapConsumer(sourceMapContent, pathToFileURL(sourceMapFilePath).href);

    root.walkRules((rule) => {
      const { line, column } = rule.source?.start ?? {};
      if (line === undefined || column === undefined) return;
      const generatedPosition = smc.generatedPositionFor({
        source: pathToFileURL(cssFilePath).href,
        line,
        column: column - 1,
      });
      if (generatedPosition.line === null || generatedPosition.column === null) return;

      console.log({ line, column, generatedPosition });

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
