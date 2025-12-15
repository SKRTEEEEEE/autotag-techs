import { createMock } from "@/tests/unit/utils/mock";

import { Outputs } from "@/src/outputs/outputs";

export class OutputsMock implements Outputs {
  private readonly mock = createMock<Outputs>();

  save(name: string, value: unknown) {
    this.mock.save(name, value);
  }

  saveDetectedTechs(techs: string[]): void {
    this.mock.saveDetectedTechs(techs);
  }

  saveCreatedTopics(topics: string[]): void {
    this.mock.saveCreatedTopics(topics);
  }

  setSkipMessage(message: string): void {
    this.mock.setSkipMessage(message);
  }

  assertSaveToHaveBeenCalledWith(name: string, value: unknown): void {
    expect(this.mock.save).toHaveBeenCalledWith(name, value);
  }
}
