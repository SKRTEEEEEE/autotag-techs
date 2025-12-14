import { getBooleanInput, getInput } from "@actions/core";

import { Inputs } from "./inputs";

export class CoreInputs implements Inputs {
  get token(): string {
    return getInput("token", { required: true });
  }

  get full(): boolean {
    return getBooleanInput("full") || false;
  }
}
