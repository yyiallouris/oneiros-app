# Production build artifacts — Oneiros 1.2.0

These files were produced by the EAS `production` profile from the approved repository snapshot. They are archived for validation and later store upload; they have not been submitted to either store.

## Submission artifacts — build 6

Build 6 is the submission line. It removes the generated Expo launcher URL scheme from both platforms and removes optional Android overlay/legacy shared-storage permissions plus development-only Android activities.

### iOS build 6

- File: `Oneiros-1.2.0-build-6.ipa`
- Successful EAS build ID: `4142d90b-4dab-4cf4-b5ca-f3ccba63a3a0`
- Size: `24,468,017` bytes
- SHA-256: `fa26e2e5e228979c06d08effc8c5c23a2c0b4a04bd34b2b77e19de7ccc815be7`
- Bundle/version: `com.oneirosdreamjournal.app`, `1.2.0 (6)`.
- Device/minimum OS: iPhone only (`UIDeviceFamily = [1]`), iOS 15.1.
- URL schemes: only `oneiros-dream-journal` and `com.oneirosdreamjournal.app`; no generated `exp+` scheme.
- Entitlements: Sign in with Apple present, team `566V64LC79`, `get-task-allow = false`.
- Provisioning profile: CMS signature verified with OpenSSL; App Store profile expires `2027-02-18T20:29:12Z`.
- Embedded Hermes bundle contains the current Dream Fabric, AI-reporting, subscription-deletion warning, and reflective-conversation copy.
- Developer/debugger string scan: no `exp+oneiros-app`, React Native debugger label, JS debugger label, or element-inspector label found.

The local `codesign --verify --deep --strict` command cannot build trust to the distribution certificate because that certificate chain is not installed in the local keychain (`CSSMERR_TP_NOT_TRUSTED`). The signed EAS App Store build completed successfully, its entitlements decode correctly, and its embedded provisioning profile passed independent cryptographic verification.

The first iOS build-6 attempt (`0c9309b8-c78b-481f-814f-f5b0857c25cd`) failed before native compilation because the initial `.easignore` excluded the runtime Metro stubs under `__mocks__/`. The ignore rule was corrected, protected by a contract test, and verified through a successful local production iOS export before the successful EAS rebuild above. The failed attempt produced no binary and must not be used.

### Android build 6

- File: `Oneiros-1.2.0-build-6.aab`
- Successful EAS build ID: `9f591365-a64c-4853-80fd-f935747ea66e`
- EAS status/profile: `FINISHED`, `production`, `STORE`; completed `2026-09-02T21:54:03.861Z`.
- Size: `59,908,020` bytes
- SHA-256: `1b6bd36b2baf9f1ec08cb66ad703937bca471a995f04c3ecced158deb09955f5`
- EAS fingerprint: `7c0d80ef443940498e1ca7522e901c34d26618f6`
- `bundletool 1.18.3 validate`: passed with exit code `0`.
- Package/version/SDK: `com.oneirosdreamjournal.app`, `1.2.0 (6)`, min SDK 24, target/compile SDK 36.
- Bundle page alignment: `PAGE_ALIGNMENT_16K`.
- URL schemes: only the Oneiros-owned `oneiros-dream-journal` scheme; no generated `exp+` scheme.
- Forbidden manifest residue scan: no `SYSTEM_ALERT_WINDOW`, legacy `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`, Expo dev-launcher/dev-menu activity, Compose preview activity, or debuggable flag.
- Expected permissions only: networking, optional microphone/audio, biometrics, vibration, Play Billing, foreground media playback, Wi-Fi/network state, dynamic receiver protection, and Play Install Referrer.
- Android backup rules exclude SecureStore preferences and pending/legacy voice recordings from cloud backup and device transfer.
- JAR signature integrity: passed. Upload-certificate SHA-256 is `50:F4:04:78:E5:6C:EE:D3:BB:8B:8F:B8:07:A8:FD:F2:8A:B1:D2:8A:61:C7:6C:0F:42:DE:A4:CF:44:93:3B:3E`, valid through 2053-07-12. The expected self-signed upload-certificate chain is not trusted by the local Java trust store.
- Embedded production bundle contains Dream Fabric, discreet AI reporting, subscription/account-deletion disclosure, and the unchanged `Continue the conversation` CTA.
- Developer/debugger string scan: no generated Expo URL, React Native/JS debugger label, or element-inspector label found.

The earlier queued Android build-6 job (`705ff743-a4f7-478f-8a81-b58d6576be49`) used the same incomplete snapshot as the failed first iOS attempt. It was canceled before compilation and produced no binary. A local production Android export passed before the corrected job above was created.

## Superseded archive — build 5, do not submit

Build 5 completed successfully on EAS and passed basic bundle/signature validation, but artifact inspection found release-hardening gaps. Both binaries were moved to `superseded-do-not-submit/` so they cannot be confused with submission artifacts.

### iOS build 5

- File: `superseded-do-not-submit/Oneiros-1.2.0-build-5.ipa`
- EAS build ID: `69a2777a-a520-4b87-8f9a-e7b9c1358f68`
- Size: `24,467,944` bytes
- SHA-256: `76912343919e095101365da8e0428938579dd741f1cab4a32b5601f5c18e76e1`
- Reason superseded: contained the generated `exp+oneiros-app` development-launcher URL scheme.

The local `codesign --verify --deep --strict` command could not build trust to the distribution certificate because that certificate chain is not installed in the local keychain (`CSSMERR_TP_NOT_TRUSTED`). EAS completed the signed App Store build successfully, and the embedded provisioning profile itself passed cryptographic verification.

### Android build 5

- File: `superseded-do-not-submit/Oneiros-1.2.0-build-5.aab`
- EAS build ID: `30b1d9a2-a9ce-4fa2-a5d6-ba26552c0538`
- Size: `59,908,085` bytes
- SHA-256: `dc8b9441edb7f225e1d1692101ca1d47fa56efcd03f7bf1ed44f978b69b96ea7`
- `bundletool 1.18.3 validate`: passed.
- JAR signature integrity: passed; the expected self-signed Play upload-key chain is not trusted by the local Java trust store.
- Package/version/SDK: `com.oneirosdreamjournal.app`, `1.2.0 (5)`, min SDK 24, target/compile SDK 36.
- Reason superseded: contained `exp+oneiros-app`, `SYSTEM_ALERT_WINDOW`, legacy `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`, and a Compose tooling activity. These are not required by Oneiros and are removed in build 6.
