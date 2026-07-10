const getBackendUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

export const BACKEND_URL = getBackendUrl();
