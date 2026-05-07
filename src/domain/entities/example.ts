export type Example = {
  id: string;
  name: string;
};

export type ExampleWithAge = Example & {
  age: number;
};
