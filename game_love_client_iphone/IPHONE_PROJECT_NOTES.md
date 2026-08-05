# iPhone Project Notes

This folder is a separate copy of `game_love_client` for iPhone/iOS adaptation.

The original Android app folder remains:

```text
game_love_client
```

The iPhone adaptation folder is:

```text
game_love_client_iphone
```

Work on iPhone-specific changes only in this folder.

Initial separation applied:

- npm package name changed to `game_love_client_iphone`.
- Expo slug changed to `liba-game-iphone`.
- EAS project id was removed so this copy can be linked to a separate EAS project.
- EAS build profiles were renamed to iOS-only profiles.
- EAS now has separate profiles for a Mac simulator build and a physical iPhone development build.
- iOS build number was added.
- Android native files and Android credentials were removed from this copy.
- The npm Android script was removed from this copy.
- The Android Google URL scheme was removed from this copy.

iPhone UI adaptation started:

- Login, registration, password reset, new password, welcome, game mode, update details, and card select screens now account for iPhone safe areas.
- Form screens now use iOS keyboard offsets and scroll behavior.
- Main iPhone entry screens reserve space for the notch and home indicator.

Important before a real App Store build:

- Keep `ios.bundleIdentifier` as `com.liba.game` until a matching Apple/Firebase/Google iOS setup is confirmed.
- If changing the bundle identifier later, also replace `GoogleService-Info.plist`, `iosClientId`, and the Google Sign-In URL scheme with credentials that match the new bundle identifier.
- `node_modules` was not copied into this folder. Run `npm install` inside `game_love_client_iphone` before starting the app locally.
