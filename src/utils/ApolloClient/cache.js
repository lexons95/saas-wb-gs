import { makeVar } from '@apollo/client';

// Create the initial value
const initialConfig = null;
const initialUser = null;

// Create the todos var and initialize it with the initial value
export const configVar = makeVar(
  initialConfig
);
export const userVar = makeVar(
  initialUser
);