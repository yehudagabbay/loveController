const androidClientId =
  '726714686390-pv5i7cm3k5rhtdbl1aea0hpn3ar9mqpp.apps.googleusercontent.com';

const webClientId =
  '726714686390-s7qsqqu51hhh3mq1srqj74s91907ls2c.apps.googleusercontent.com';

const iosClientId =
  '726714686390-lll4a3abu4chgi2ha79t8ca769h2bvrr.apps.googleusercontent.com';

const googleRedirectScheme = 'loveclient';

export const googleAuthConfig = {
  webClientId,
  androidClientId,
  iosClientId,
  redirectScheme: googleRedirectScheme,
  redirectPath: 'oauthredirect',
  redirectUri: `${googleRedirectScheme}:/oauthredirect`,
};
