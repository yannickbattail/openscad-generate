#!/usr/bin/env node

import { Command } from "commander";
import Ajv, { JSONSchemaType } from "ajv";

export interface CLIArgsSchema {
  /**
   * Input file
   */
  input: string;
  /**
   * Mode of operation
   */
  mode?: Mode;
  /**
   * Output file
   */
  output: string;
  /**
   * Retry attempts
   */
  retries?: number;
  /**
   * Verbose logging
   */
  verbose?: boolean;
}

/**
 * Mode of operation
 */
export enum Mode {
  Development = "development",
  Production = "production",
}

const schema: JSONSchemaType<CLIArgsSchema[]> = {
  anyOf: [],
  oneOf: [],
  type: "object",
  properties: {
    input: {
      type: "string",
      description: "The input value",
    },
    mode: {
      type: "Mode",
      description: "The mode value (optional)",
    },
    output: {
      type: "string",
      description: "The output value",
    },
    retries: {
      type: "integer",
      description: "The retries value (optional)",
    },
    verbose: {
      type: "boolean",
      description: "The verbose value (optional)",
    },
    property: {
      type: "string]: any",
      description: "The property value",
    },
  },
  required: ["input", "output", "property"],
  additionalProperties: false,
  $schema: "http://json-schema.org/draft-07/schema#",
};

const program = new Command();

const argMap = {
  string: "<value>",
  integer: "<number>",
  number: "<number>",
  boolean: "",
};

for (const [key, prop] of Object.entries(schema.properties) as [string, { type: string; description: string }][]) {
  const type = prop.type;
  const description = prop.description || "";
  const isRequired = schema.required?.includes(key);
  const argPlaceholder = argMap[type] ?? "<value>";
  const flag = type === "boolean" ? `--${key}` : `--${key} ${argPlaceholder}`;

  if ("default" in prop) {
    program.option(flag, description, prop.default as string);
  } else if (!isRequired && type === "boolean") {
    program.option(flag, description, "");
  } else {
    program.option(flag, description);
  }
}

// Parse and validate
program.parse(process.argv);
const opts = program.opts();

const ajv = new Ajv.default();
const validate = ajv.compile(schema);

if (!validate(opts)) {
  console.error("Invalid CLI arguments:");
  console.error(validate.errors);
  process.exit(1);
}

console.log("Valid arguments:", opts);
