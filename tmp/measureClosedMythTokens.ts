import { createRequire } from 'module';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  DREAM_EXTRACTION_PROMPT_VERSION,
} from '../src/ai/dreamExtractionPrompt.ts';
import {
  MYTHIC_PROMPT_INDEX,
  MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
} from '../src/ai/catalogs/mythicPromptIndex.ts';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { encode } = require('/tmp/tok/node_modules/gpt-tokenizer') as {
  encode: (s: string) => number[];
};

const system = buildDreamExtractionSystemPrompt();
console.log(
  JSON.stringify(
    {
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      compactIndexTokens: encode(MYTHIC_PROMPT_INDEX).length,
      compactIndexConstant: MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
      totalSystemPromptTokens: encode(system).length,
      systemChars: system.length,
    },
    null,
    2
  )
);
