export interface Outputs {
  save(name: string, value: unknown): void;
  saveDetectedTechs(techs: string[]): void;
  saveCreatedTopics(topics: string[]): void;
}
