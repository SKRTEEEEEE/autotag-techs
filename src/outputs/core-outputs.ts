import { setOutput } from "@actions/core";

import { Outputs } from "./outputs";

export class CoreOutputs implements Outputs {
  save(name: string, value: unknown): void {
    setOutput(name, value);
  }

  saveDetectedTechs(techs: string[]): void {
    setOutput("detected_techs", techs.join(","));
  }

  saveCreatedTopics(topics: string[]): void {
    setOutput("created_topics", topics.join(","));
  }

  setSkipMessage(message: string): void {
    setOutput("skip_message", message);
    setOutput("skipped", "true");
  }
}
