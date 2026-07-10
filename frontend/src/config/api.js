const DEFAULT_BACKEND_URL = 'https://evm-machine.onrender.com';

const getBackendUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  return DEFAULT_BACKEND_URL;
};

export const BACKEND_URL = getBackendUrl();
