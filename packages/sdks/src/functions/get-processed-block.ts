import { TARGET } from '../constants/target.js';
import type { BuilderContextInterface } from '../context/types.js';
import { omit } from '../helpers/omit.js';
import type { BuilderBlock } from '../types/builder-block.js';
import { evaluate } from './evaluate/index.js';
import { resolveLocalizedValues } from './extract-localized-values.js';
import { fastClone } from './fast-clone.js';
import { set } from './set.js';
import { transformBlock } from './transform-block.js';

// Deep clone a block but without cloning any child blocks
export function deepCloneWithConditions<T = any>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: any) => deepCloneWithConditions(item)) as T;
  }

  if ((obj as any)['@type'] === '@builder.io/sdk:Element') {
    return obj;
  }

  const clonedObj: any = {};

  for (const key in obj) {
    if (key !== 'meta' && Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepCloneWithConditions(obj[key]);
    }
  }

  return clonedObj;
}

const IS_SDK_WITHOUT_CACHED_PROCESSED_BLOCK = [
  'svelte',
  'vue',
  'angular',
  'qwik',
  'solid',
].includes(TARGET);

const getCopy = (block: BuilderBlock): BuilderBlock => {
  if (IS_SDK_WITHOUT_CACHED_PROCESSED_BLOCK) {
    const copy = fastClone(block);
    const copied = {
      ...copy,
      properties: { ...copy.properties },
      actions: { ...copy.actions },
    };
    return copied;
  } else {
    const copy = deepCloneWithConditions(
      omit(block, 'children', 'meta')
    ) as BuilderBlock;
    return {
      ...copy,
      properties: { ...copy.properties },
      actions: { ...copy.actions },
      children: block.children,
      meta: block.meta,
    };
  }
};

const evaluateBindings = ({
  block,
  context,
  localState,
  rootState,
  rootSetState,
}: {
  block: BuilderBlock;
} & Pick<
  BuilderContextInterface,
  'localState' | 'context' | 'rootState' | 'rootSetState'
>): BuilderBlock => {
  if (!block.bindings) {
    return block;
  }
  const copied = getCopy(block);

  for (const binding in block.bindings) {
    const expression = block.bindings[binding];
    const value = evaluate({
      code: expression,
      localState,
      rootState,
      rootSetState,
      context,
    });
    set(copied, binding, value);
  }
  return copied;
};

export function getProcessedBlock({
  block,
  context,
  localState,
  rootState,
  rootSetState,
}: {
  block: BuilderBlock;
} & Pick<
  BuilderContextInterface,
  'localState' | 'context' | 'rootState' | 'rootSetState'
>): BuilderBlock {
  let transformedBlock = transformBlock(block);
  transformedBlock = evaluateBindings({
    block: transformedBlock,
    localState,
    rootState,
    rootSetState,
    context,
  });
  transformedBlock = resolveLocalizedValues(
    transformedBlock,
    rootState.locale as string | undefined
  );
  return transformedBlock;
}
