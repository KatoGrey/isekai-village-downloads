# Apple builds (Mac, iPhone, iPad)

These folders make the Mac app and the iPhone/iPad app from a release. Nothing here contains the game itself: the
**Apple builds** workflow (`.github/workflows/apple.yml`) takes the game out of that release's Android APK, so every
device plays exactly the same build, and wraps it on GitHub's macOS machines.

- `mac/`: the Windows app's wrapper for macOS (Electron). One app for Apple silicon and Intel, signed ad hoc, zipped.
  Saves live in `~/Library/Application Support/Isekai Village`, and the first start of a new version backs them up to
  `save-backups/` first, as on Windows.
- `ios/`: the Android app's wrapper for iPhone and iPad (Capacitor). `shim/ios.ts` sends "Save to a file" to the
  share sheet; `native/GameViewController.swift` keeps the game inside the safe area (clear of the notch and the home
  bar). The app is unsigned: AltStore or Sideloadly sign it with the player's own Apple ID when they install it.
- `tools/icons.py`: the icons and the launch screen, from `icon.png` (the game's 256 px icon, scaled in whole steps).

## Making them for a release

1. Publish the release as usual (Windows files, the APK, and the SHA-256 block in the notes).
2. Actions → **Apple builds** → **Run workflow**, with the tag (e.g. `v128`). Leave *attach* off for a trial run: the
   builds and pictures of each app's first minute (`mac-shot`, `ios-shots`) are kept as artifacts for a week.
3. Run it again with *attach* on. The job prints two `<sha256>  <file>` lines: add them to the release notes' SHA-256
   block (`notes/vNNN.md`, then `gh release edit vNNN --notes-file notes/vNNN.md`).

The file names are `IsekaiVillage-vNNN-mac.zip` and `IsekaiVillage-vNNN-ios.ipa`.

## With an Apple developer account later ($99 a year)

The same Xcode project can be signed and sent through TestFlight, so friends install with one tap and updates arrive by
themselves, and the Mac app can be notarized so Gatekeeper no longer asks. Neither needs changes to the game.
