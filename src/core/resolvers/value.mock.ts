import { SchemaObject } from 'openapi3-ts';
import { MockOptions } from '../../types';
import { MockDefinition } from '../../types/mocks';
import { isReference } from '../../utils/is';
import { getRef } from '../getters/ref';
import { getMockScalar } from '../getters/scalar.mock';

const isRegex = (key: string) => key[0] === '/' && key[key.length - 1] === '/';

export const resolveMockOverride = (
  properties: any = {},
  item: SchemaObject & { name: string; path?: string },
) => {
  const property = Object.entries(properties).find(([key]) => {
    if (isRegex(key)) {
      const regex = new RegExp(key.slice(1, key.length - 1));
      if (regex.test(item.name)) {
        return true;
      }
    }

    if (`#.${key}` === (item.path ? item.path : `#.${item.name}`)) {
      return true;
    }

    return false;
  });

  if (!property) {
    return;
  }

  return {
    value: getNullable(property[1] as string, item.nullable),
    imports: [],
    name: item.name,
    overrided: true,
  };
};

export const getNullable = (value: string, nullable?: boolean) =>
  nullable ? `faker.helpers.randomize([${value}, null])` : value;

export const resolveMockValue = ({
  schema,
  schemas,
  allOf,
  mockOptions,
  operationId,
}: {
  schema: SchemaObject & { name: string; path?: string };
  schemas: { [key: string]: SchemaObject };
  operationId: string;
  allOf?: boolean;
  mockOptions?: MockOptions;
}): MockDefinition => {
  if (isReference(schema)) {
    const value = getRef(schema.$ref);
    const newSchema = {
      ...schemas[value],
      name: value,
      path: schema.path,
      isRef: true,
    };

    return getMockScalar({
      item: newSchema,
      schemas,
      allOf,
      mockOptions,
      operationId,
    });
  }

  return getMockScalar({
    item: schema,
    schemas,
    allOf,
    mockOptions,
    operationId,
  });
};
