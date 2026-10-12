# ApexMousePlugins 🧩

The official open-source community repository for **[ApexMouse](https://apexmouse.tech)** plugins, radial action dials, and hardware tunings.

Here, creators and power users can share and discover pre-calibrated `.apexplugin` packs for popular macOS applications and system-wide workflows.

---

## 🚀 Quick Install

### Method 1: 1-Click In-App Install
Click any plugin link in the [Community Hub](https://apexmouse.tech/community) or use the custom URL scheme:
```text
apexmouse://plugin/install?id=com.community.macos-power-tools
```

### Method 2: Drag & Drop
1. Download any `.apexplugin` bundle from the [`plugins/`](./plugins/) directory.
2. Double-click the file or drag it directly onto the **ApexMouse Settings → Community** window.
3. Review the live visual action diff and click **Install & Activate**.

---

## 📁 Repository Structure

```text
ApexMousePlugins/
├── README.md               # Contributor handbook & schema guide (this file)
├── catalog.json            # Master registry synced with apexmouse.tech/community
└── plugins/                # Standalone .apexplugin bundle files
    ├── com.community.macos-power-tools.apexplugin     # Global: System Power Tools Dial
    ├── com.community.window-manager-dial.apexplugin   # Global: Window Snapping & Space Dial
    ├── com.community.mx-master-tuning.apexplugin      # Global: Logitech MX Master 3S Tuning
    ├── com.community.browser-supercharger.apexplugin  # Global: Universal Browser Power Deck
    ├── com.community.figma-pro.apexplugin             # App: Figma SuperDial & Canvas
    ├── com.community.vscode-coder.apexplugin          # App: VS Code & Cursor Velocity
    ├── com.community.antigravity-flow.apexplugin      # App: Antigravity AI IDE Velocity
    ├── com.community.ms-edge-deck.apexplugin          # App: Microsoft Edge SuperDeck
    ├── com.community.ms-teams-meeting.apexplugin      # App: Microsoft Teams Meeting Deck
    ├── com.community.whatsapp-connect.apexplugin      # App: WhatsApp Quick Dial
    ├── com.community.slack-workspace.apexplugin       # App: Slack Workspace Velocity
    ├── com.community.notion-workbench.apexplugin      # App: Notion Knowledge Workbench
    ├── com.community.finalcut-deck.apexplugin         # App: Final Cut Precision Deck
    └── com.community.blender-orbit.apexplugin         # App: Blender 4.x Viewport Orbit
```

---

## 🎯 Plugin Types: Global vs. App-Specific

ApexMouse supports two distinct plugin scopes:

| Scope | `targetBundleId` | Best For | Behavior |
| :--- | :--- | :--- | :--- |
| **Global** | `"*"` | System utilities, window snapping dials, mouse hardware profiles, universal browser shortcuts. | Applies across all applications. Automatically backs up previous user state for 1-click non-destructive rollback. |
| **App-Specific** | `"com.vendor.AppName"` (e.g. `com.figma.Desktop`) | Pro workflows for Figma, VS Code, Final Cut, Blender, Xcode, Ableton. | Activates automatically only when the target app is frontmost. Leaves other apps completely untouched. |

---

## 🛡️ Safety & Quality Guidelines

Every submitted plugin is automatically screened by the ApexMouse Safety Linter:

1. **Left (0) & Right (1) Clicks Are Immutable**:
   - Hardware buttons 0 and 1 **cannot be remapped** under any circumstances. Any plugin mapping `button0` or `button1` will be rejected.
2. **Protected macOS Bundles**:
   - Plugins targeting core security processes (`com.apple.loginwindow`, `com.apple.SecurityAgent`, `com.apple.SystemSettings`, password managers) are blocked.
3. **No Dangerous System Keystrokes**:
   - Destructive key sequences such as Force Quit (`⌘⌥⎋`), Immediate Logout (`⇧⌘⌥Q`), or restart commands cannot be bound.
4. **Human-Readable Labels**:
   - Radial slices must have clear, concise labels (e.g. "Auto Layout", "Blade Cut", "New Tab") and valid SF Symbols.

---

## 📝 How to Create & Submit a Plugin

### Option A: Export Directly from ApexMouse (Recommended)
1. Open **ApexMouse Settings**.
2. Customize your Radial Dial, Button Mappings, and Scroll Physics for your desired app (or global setup).
3. Switch to the **Community** tab and click **Export**.
4. Fill in the metadata (Plugin Name, Author Name, Category, Description) and click **Save & Export .apexplugin**.

### Option B: Author by Hand
Create a JSON file named `<your-plugin-id>.apexplugin` using the schema below:

```json
{
  "schemaVersion": "1.0",
  "id": "com.yourname.app-shortcuts",
  "name": "App SuperDial & Deck",
  "author": {
    "name": "Your Name",
    "url": "https://yourwebsite.com"
  },
  "version": "1.0.0",
  "targetBundleId": "com.example.app",
  "targetAppName": "Example App",
  "category": "productivity",
  "description": "8-way radial dial and quick navigation shortcuts.",
  "icon": "sparkles",
  "contents": {
    "radialMenu": [
      {
        "label": "Action 1",
        "systemImage": "star.fill",
        "shortcut": "⌘1"
      },
      {
        "label": "Mission Control",
        "systemImage": "square.2.layers.3d.top.filled",
        "systemAction": "missionControl"
      }
    ],
    "buttonMappings": {
      "button3_click": { "shortcut": "⌘Z" },
      "button4_click": { "systemAction": "showRadialMenu" }
    },
    "scrollOverrides": {
      "speed": 1.2,
      "duration": 0.22,
      "smoothScrollEnabled": true
    }
  }
}
```

### Submitting via Pull Request
1. Fork this repository.
2. Add your `.apexplugin` file into the `plugins/` directory.
3. Update `catalog.json` with your plugin's metadata.
4. Open a Pull Request titled `Add <Plugin Name> plugin`.
5. Once merged, your plugin is automatically distributed to the in-app Community Hub and the public directory at `apexmouse.tech/community`!

---

## 🏷️ Categories

- `design`: UI/UX, 3D, vector, and photo apps (Figma, Blender, Sketch, Illustrator).
- `coding`: Editors, IDEs, and terminals (VS Code, Cursor, Xcode, iTerm2).
- `media`: Video, audio, and color grading (Final Cut, DaVinci Resolve, Premiere, Logic).
- `productivity`: Browsers, note taking, task managers (Safari, Chrome, Arc, Notion, Obsidian).
- `gaming`: Strategy, FPS, and MMO game toolbars.
- `hardware`: Mouse-specific ergonomic tunings (MX Master 3S, Razer, Keychron, Pulsar).

---

## 📄 License
All plugins submitted to this repository are released under the [MIT License](LICENSE) to ensure free and open distribution for the entire Mac community.
