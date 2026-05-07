// Sempre utilizar esse type Domain e a funcao de erro nas features.

export type Domain<T, Y> = (input: T) => Promise<Y>;

export type DomainErrorParams = {
  msg: string;
  err: unknown;
};

export const DomainError = ({ msg, err }: Readonly<DomainErrorParams>) => {
  throw new Error(`${msg}: ${err}`);
};
