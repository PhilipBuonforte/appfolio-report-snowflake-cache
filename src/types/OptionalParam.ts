export type OptionalParam = {
  // Define the optional parameter type here
  isFirstRun: boolean;
  from: string;
  to: string;

  [key: string]: string | boolean;
};
