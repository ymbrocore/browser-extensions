# Browser API Test — Manifest V3

Diagnostic extension for testing browser extension APIs in Yandex Browser on Android and desktop. Extension version: **0.2.0**.

## Original project and attribution

This repository is a Manifest V3 migration of **[yandex/browser-extensions](https://github.com/yandex/browser-extensions)**, including its **[Browser API Test extension](https://github.com/yandex/browser-extensions/tree/master/api-test-extension)**. The migration was prepared against upstream revision **[117c68024e86da840454940adbd147ab42e8b0bd](https://github.com/yandex/browser-extensions/commit/117c68024e86da840454940adbd147ab42e8b0bd)**. Original authorship, history, images and third-party notices are preserved; this fork does not imply an upstream endorsement.

The bundled jQuery 2.0.0 retains its original [MIT license notice](api-test-extension/js/jquery/jquery.js#L9). No new license is assigned to the upstream code by this migration.

## Download and install

1. Download **[browser-api-test-mv3.zip](https://github.com/ymbrocore/browser-extensions/raw/refs/heads/master/browser-api-test-mv3.zip)** and extract it on the test device. The archive contains the extension itself; `manifest.json` is at its root.
2. Alternatively, download this repository using **Code → Download ZIP**, extract it and use the **`api-test-extension`** subfolder. Do not select the repository root as the extension directory.
3. Open **`browser://extensions`** in Yandex Browser and enable **Developer mode**.
4. Choose **Load unpacked extension**. On Android, select **`manifest.json`** inside the extension folder using the file picker. On desktop, select the folder containing that file.
5. Open **Browser API Test** from the browser's extensions menu or toolbar. The diagnostic report opens in a separate extension tab.
6. Wait for automatic checks, perform relevant manual checks and use **Save report** to download a self-contained HTML report.

Use a dedicated test profile: the suite creates and removes tabs, bookmarks, cookies, downloads and browsing history, and its manual checks can change browser data. The broad API and HTTP/HTTPS host permissions are intentional for diagnostics. An Internet connection is needed for checks against `ya.ru`.

## Migration

- Manifest version 3, `background.service_worker`, `action`, `host_permissions` and `scripting` permissions.
- DOM-free background worker; message and context-menu listeners register at startup. Report, popup and worker communicate through `chrome.runtime` messages.
- Script and stylesheet injection use `chrome.scripting`. Legacy tab queries use `tabs.query`.
- Updated navigation waits, network checks, notifications, download checks and report export. Added a manual worker stop/restart check.
- Removed MV2/legacy mechanisms are explicitly marked **SKIP**. A skipped or disabled check does not demonstrate that the corresponding API works.

The **[migration patch](manifest-v3.patch)** records changes against the upstream revision above. Source code is available in **[api-test-extension](api-test-extension)**. No build step is required.

## Validation and known limitations

The migrated extension was exercised in Yandex Browser on macOS and an Android 14 phone emulator. MV3 installation, worker messaging, dynamic script injection and HTML report export worked on both. Worker stop/restart was verified on both; repeated native popup openings were verified on Android.

A desktop run produced **324 automatic checks: 304 PASS, 10 WARN, 0 FAIL, 10 SKIP**. This includes API-existence checks and does not mean every user scenario passed. Exported HTML hides some successful checks, so its visible row count is not comparable to the full in-memory count.

Known issues in the current diagnostic suite:

- The manual history Delete button has a mismatched element ID/handler selector and does not execute its action.
- Some older callback checks omit `runtime.lastError` handling and can report PASS despite an asynchronous API error. For example, `downloads.setShelfEnabled` lacks the required `downloads.shelf` permission.
- Android reports unsupported/unimplemented results for language detection, tab zoom controls and sessions; some privacy settings are absent. These are API compatibility limitations, not evidence that the MV3 worker failed.
- Tab-count checks use short fixed waits. Android also failed the CSS and static content-script checks; the root causes of those failures have not been established. Do not treat them as confirmed platform restrictions.
- The native desktop popup was not confirmed: `action.openPopup()` returned an error, while loading `popup.html` as an extension tab succeeded. An extension tab is not a native popup check.
- Notification clicks, OS idle/lock transitions and context-menu selection need dedicated manual execution. Screen capture needs an appropriate `activeTab` grant; download pause/resume needs a sufficiently slow download.

Use the report as a diagnostic aid and inspect individual errors. The **[original published report](https://yandex.github.io/browser-extensions/)** is a historical format example, not the current MV3 result or download.

## References

- [Chrome: Migrate to Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate)
- [Update the manifest](https://developer.chrome.com/docs/extensions/develop/migrate/manifest)
- [Migrate to a service worker](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)
- [Update extension API calls](https://developer.chrome.com/docs/extensions/develop/migrate/api-calls)
- [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [Content scripts and match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [Action API](https://developer.chrome.com/docs/extensions/reference/api/action)
- [Runtime API and lastError](https://developer.chrome.com/docs/extensions/reference/api/runtime#property-lastError)
- [Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Downloads API](https://developer.chrome.com/docs/extensions/reference/api/downloads)

The Chrome documentation describes the upstream API contract. Availability and behavior must also be checked in the target Yandex Browser build and platform.
