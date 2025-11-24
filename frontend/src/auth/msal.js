import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'localStorage' }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginWithMicrosoftPopup = async () => {
  const loginResponse = await msalInstance.loginPopup({
    scopes: ['openid', 'profile', 'email']
  });
  const accounts = msalInstance.getAllAccounts();
  const account = accounts[0];
  const idToken = loginResponse.idToken;
  return { account, idToken };
};