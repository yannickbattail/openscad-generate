import Ajv from "ajv";
import { openscadParameterKvSchema, ParameterKV } from "openscad-cli-wrapper";

const ajv = new Ajv.default();
const validateParameterKV = ajv.compile<ParameterKV[]>(
  openscadParameterKvSchema,
);
// const validateParameterList = ajv.compile<ParameterDefinition>(
//   openscadParameterDefinitionSchema,
// );

export function IsParameterKvValid<T>(data: unknown): T {
  try {
    if (validateParameterKV(data)) {
      return data as T;
    } else {
      throw {
        message: "Validation errors:",
        error: validateParameterKV.errors,
      };
    }
  } catch (error) {
    console.error("Invalid JSON:", error);
    throw { message: "Invalid JSON:", errors: error };
  }
}

// export function IsParameterListValid<T>(data: unknown): T {
//   try {
//     if (validateParameterList(data)) {
//       return data as T;
//     } else {
//       throw {
//         message: "Validation errors:",
//         error: validateParameterList.errors,
//       };
//     }
//   } catch (error) {
//     console.error("Invalid JSON:", error);
//     throw { message: "Invalid JSON:", errors: error };
//   }
// }
