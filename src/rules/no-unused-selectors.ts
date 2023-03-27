import { readFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import { SourceMapConsumer } from 'source-map';
import type stylelint from 'stylelint';
import { utils } from 'stylelint';
import { Project, Node } from 'ts-morph';
import { NAMESPACE } from '../constant';
import type { Option } from '../util/validateTypes';
import { isBoolean, isOption } from '../util/validateTypes';

const ruleName = `${NAMESPACE}/no-unused-selectors`;

const messages = utils.ruleMessages(ruleName, {
  unused: (selector: string) => `\`${selector}\` is defined but not used.`,
});

export const noUnusedSelectors: stylelint.Rule<boolean> = (primaryOption, secondaryOptions, _context) => {
  return async (root, result) => {
    const validOptions = utils.validateOptions(
      result,
      ruleName,
      { actual: primaryOption, possible: isBoolean },
      { actual: secondaryOptions, possible: isOption },
    );
    if (!validOptions || !primaryOption) {
      return;
    }

    const project = new Project({ tsConfigFilePath: (secondaryOptions as Option).tsConfigFilePath });

    if (root.source?.input.file === undefined) return;

    const cssFilePath = root.source.input.file;
    const dtsFilePath = `${cssFilePath}.d.ts`;
    const sourceMapFilePath = `${dtsFilePath}.map`;

    const sourceMapContent = await readFile(sourceMapFilePath, 'utf-8');
    const smc = await new SourceMapConsumer(sourceMapContent, pathToFileURL(sourceMapFilePath).href);

    root.walkRules((rule) => {
      // postcss's line and column are 1-based
      const { line, column } = rule.source?.start ?? {};
      if (line === undefined || column === undefined) return;
      const generatedPosition = smc.generatedPositionFor({
        source: pathToFileURL(cssFilePath).href,
        line, // mozilla/source-map is 1-based
        column: column - 1, // mozilla/source-map is 0-based
      });
      const generatedPositions = [generatedPosition];

      let isReferenced = false;
      for (const generatedPosition of generatedPositions) {
        const sourceFile = project.getSourceFile(dtsFilePath);
        if (sourceFile === undefined) throw new Error(`Cannot find ${dtsFilePath}'s source file. ${process.cwd()}`);
        if (generatedPosition.line === null || generatedPosition.column === null)
          throw new Error('Invalid generated position.');
        const pos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
          generatedPosition.line - 1, // TypeScript Compiler API is 0-based
          generatedPosition.column, // TypeScript Compiler API is 0-based
        );
        const stringLiteralNode = sourceFile.getDescendantAtPos(pos);
        if (!Node.isStringLiteral(stringLiteralNode))
          throw new Error(
            `Unexpected node type \`${
              stringLiteralNode?.getKindName?.() ?? 'undefined'
            }\`. Expected \`StringLiteral\`.`,
          );
        const propertySignatureNode = stringLiteralNode.getParent();
        if (!Node.isPropertySignature(propertySignatureNode))
          throw new Error(
            `Unexpected node type \`${
              propertySignatureNode?.getKindName?.() ?? 'undefined'
            }\`. Expected \`PropertySignature\`.`,
          );
        const refs = propertySignatureNode.findReferencesAsNodes();
        const refsWithoutDts = refs.filter((ref) => !ref.getSourceFile().getFilePath().endsWith('.css.d.ts'));
        if (refsWithoutDts.length > 0) {
          isReferenced = true;
          break;
        }
      }

      if (!isReferenced) {
        utils.report({
          result,
          ruleName,
          node: rule,
          message: messages.unused(rule.toString()),
        });
      }
    });
  };
};

noUnusedSelectors.ruleName = ruleName;
noUnusedSelectors.messages = messages;
