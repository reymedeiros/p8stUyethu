# AI Implementation Guide - Emergent.sh Visual Clone

## Project Overview
This document provides a comprehensive analysis and implementation guide for creating a pixel-perfect visual clone of the Emergent.sh AI Agent execution UI.

- Secure execution sandbox is already implemented
- Agent-based multi-step code generation (not simple chat)
- Supports multiple AI providers (cloud and local)
- Supports local models via LM Studio using an OpenAI-compatible API
- Supports small models with reduced context
- Uses multi-step processing pipelines
- One-command installation on Ubuntu Server 24.04 (install.sh)
- **Real-time WebSocket communication between frontend and backend**
- **Project creation triggers automatic build execution with live updates**

### Tech Stack
- **Frontend**: Next.js with TypeScript
- **Backend**: Node.js with TypeScript and Fastify
- **Python Proxy**: server.py managed by supervisor

**Important constraints**:
- The Python proxy runs on port 8001
- Supervisor starts ONLY the Python proxy
- The Python proxy forwards ALL requests to the Fastify backend on port 4000
- The Python environment MUST have httpx installed
- Code-server runs on port 8080 with global password authentication
- Each project has an isolated workspace at `/workspace/projects/{projectId}`
- Code change/creation is the #1 priority of this task
- Implement the changes first.
- Do not in any circunstance start building frontend and backend before all the necessary code change are done.

### Current Project Structure
```
/app/frontend/
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main entry point
├── components/
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── HomeView.tsx
│   │   ├── MainLayout.tsx   # Tab-based navigation
│   │   ├── PromptInput.tsx
│   │   └── RecentTasks.tsx
│   ├── project/
│   │   ├── AgentChatPanel.tsx    # Chat/message interface
│   │   ├── AgentStatus.tsx       # Status indicator
│   │   ├── CodeServerDialog.tsx  # Code-server credentials dialog
│   │   ├── MessageItem.tsx       # Message rendering
│   │   ├── PreviewPanel.tsx      # App preview iframe
│   │   └── ProjectExecutionView.tsx  # Main project view
│   └── ui/
│       ├── Header.tsx
│       ├── ParticleBackground.tsx  # Keep this (animated background)
│       ├── TabBar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── api.ts               # API client with code-server endpoint
│   ├── design-tokens.ts     # Color and style tokens
│   └── store/               # Zustand state management
└── public/
    └── fonts/               # Brockmann & Ndot fonts
```

/app/backend/
├── src/
│   ├── models/
│   │   └── Project.ts       # Updated with codeServerPassword field
│   ├── routes/
│   │   └── projects.ts      # Added /projects/:id/code-server endpoint
│   └── ...
└── ...
```

---

## Reference HTML Files

### 1. Agent_Running_Project_Full_Width.html
- **State**: Agent is actively running
- **Layout**: Full-width chat panel (no preview panel)
- **Indicator**: Green animated dot with "Agent is running..." text
- **Button**: "Stop" button in message input area
- **Tab**: Shows animated green dot in tab title

### 2. Agent_Running_Project_Split_Screen.html
- **State**: Agent is actively running
- **Layout**: 50/50 split - Chat panel (left) + Preview panel (right)
- **Indicator**: Green animated dot with "Agent is running..." text
- **Preview Panel**: Shows refresh, open in new tab, and close buttons
- **Resizable divider**: Green (#00CCAF) on hover

### 3. Agent_Waiting_Project_Split_Screen.html
- **State**: Agent is waiting for user input
- **Layout**: 50/50 split - Chat panel (left) + Preview panel (right)
- **Indicator**: Blue animated dot with "Agent is waiting..." text
- **Button**: "Submit" button in message input area
- **Special**: Border-beam animation on input field

---

## Design Tokens (Extracted from HTML)

### Core Colors
```typescript
export const emergentColors = {
  // Backgrounds
  background: '#0F0F10',          // Main background
  secondary: '#1A1A1C',           // Secondary background
  inputBackground: '#1E1E1F',     // Input fields
  codeBackground: '#18181B',      // Code blocks
  cardBackground: '#171717',      // Cards
  hoverBackground: '#2A2A2B',     // Hover states
  divider: '#242424',             // Panel dividers
  border: '#252526',              // Borders
  
  // Status Colors (Agent Running)
  agentRunningPrimary: '#67CB65',         // Green - rgb(103,203,101)
  agentRunningBackground: 'rgba(103,203,101,0.125)',
  agentRunningPulse: '#67CB6570',
  agentRunningPulseTransparent: '#67CB6500',
  
  // Status Colors (Agent Waiting)
  agentWaitingPrimary: '#5FD3F3',         // Blue - rgb(95,211,243)
  agentWaitingBackground: 'rgba(95,211,243,0.125)',
  agentWaitingPulse: '#5FD3F370',
  agentWaitingPulseTransparent: '#5FD3F300',
  
  // Text Colors
  foreground: '#F8FAFC',          // Primary text
  mutedForeground: '#5C5F66',     // Muted text
  subtleText: '#939399',          // Subtle text
  stepTitle: '#ACACB2',           // Step titles
  codeText: '#CCEDFF99',          // Code/command text
  pathHighlight: '#FF99FD',       // File paths in code
  
  // Accent Colors
  accentTeal: '#00CCAF',          // Resizer handle, hover
  cyan: '#66EAFF',                // Selection, highlights
  borderBlink: '#4d9fff',         // Input focus animation
  
  // Task Colors
  taskRunning: '#2EBBE5',
  taskDone: '#DDDDE6',
  stepSuccess: '#29CC83',
  stepInactive: '#5C5F66',
  stepCompleted: '#939399',
};
```

### Typography
```typescript
export const typography = {
  fontFamily: {
    sans: "Brockmann, ui-sans-serif, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace",
    pixel: "Ndot, monospace",  // For special elements
    inter: "Inter, system-ui, sans-serif",
  },
  
  sizes: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
};
```

### Spacing & Layout
```typescript
export const layout = {
  headerHeight: '56px',
  tabBarHeight: '36px',
  inputMinHeight: '64px',
  inputMaxHeight: '200px',
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '14px',
    '2xl': '16px',
    full: '9999px',
  },
};
```

---

## Animations (CSS Keyframes)

### Status Pulse Animation
```css
/* For agent status indicator - needs CSS variables */
.animate-status-pulse {
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--status-pulse-color);
  }
  50% {
    box-shadow: 0 0 0 8px var(--status-pulse-transparent);
  }
}
```

### Border Blink Animation (Input Focus)
```css
@keyframes borderBlink {
  0%, 100% {
    border-color: rgba(77, 159, 255, 0.31);
    box-shadow: 0 0 0 rgba(77, 159, 255, 0);
  }
  50% {
    border-color: #4d9fff;
    box-shadow: 0 0 8px 2px rgba(77, 159, 255, 0.4);
  }
}
```

### Border Beam Animation (Waiting State Input)
```css
/* Complex animation for waiting state input border */
@keyframes border-beam {
  to {
    offset-distance: 100%;
  }
}

.border-beam {
    @apply pointer-events-none absolute inset-0 rounded-[inherit]
      border-[calc(var(--border-width)*1px)] border-transparent
      ![mask-clip:padding-box,border-box]
      ![mask-composite:intersect]
      [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)];
  }

  .border-beam::after {
    content: '';
    @apply absolute aspect-square
      w-[calc(var(--size)*1px)]
      animate-border-beam
      [animation-delay:var(--delay)]
      [background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]
      [offset-anchor:calc(var(--anchor)*1%)_50%]
      [offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))];
  }


```

### Sweep Animation
```css
@keyframes sweep {
  to {
    background-position: -200% center;
  }
}
```

### Collapsible Animation
```css
@keyframes collapsible-down {
  from { height: 0; }
  to { height: var(--radix-collapsible-content-height); }
}

@keyframes collapsible-up {
  from { height: var(--radix-collapsible-content-height); }
  to { height: 0; }
}
```

---

## Component Specifications

### 1. Tab Bar Component

**Location**: `/app/frontend/components/ui/TabBar.tsx`

**Elements**:
- Home tab with grid icon
- Project tabs with animated status dot
- "+" button for new tab

**Tab States**:
- Active: Background `#1A1A1C`, bottom border white
- Inactive: Transparent background
- Hover: Subtle background highlight

**Project Tab Status Indicator**:
- Running: Green dot (#67CB65) with pulse animation
- Waiting: Blue dot (#5FD3F3) with pulse animation

**HTML Reference**:
```html
<div class="rounded-lg flex justify-center items-center w-3 h-3 animate-status-pulse flex-shrink-0"
     style="background-color:rgba(103,203,101,0.125);--status-pulse-color:#67CB6570;--status-pulse-transparent:#67CB6500">
  <div class="rounded-full w-1.5 h-1.5" style="background-color:rgb(103,203,101)"></div>
</div>
```

### 2. Message Area Component

**Location**: `/app/frontend/components/project/AgentChatPanel.tsx`

**Container**:
- Background: `#0F0F10`
- Max width: `56rem` (md:max-w-4xl)
- Scrollable content area

**Code Block / Step Component**:
- Background: `#18181B` or transparent with subtle border
- Border: `1px solid #252526`
- Border radius: `8px`
- Code text color: `#CCEDFF99`
- File path highlight: `#FF99FD`
- Expand/collapse with chevron icon

**HTML Reference for Step/Tool Block**:
```html
<div class="rounded-lg overflow-hidden border border-[#252526]">
  <div class="flex items-center justify-between px-4 py-2.5">
    <div class="flex items-center gap-2">
      <!-- Checkmark for completed -->
      <svg class="w-4 h-4 text-[#29CC83]">...</svg>
      <code class="text-[#CCEDFF99] font-mono text-sm">
        <span class="flex items-center gap-2 font-mono text-wrap">
          Viewed <span class="text-[#FF99FD] font-brockmann">/app/path</span>
        </span>
      </code>
    </div>
    <svg class="w-4 h-4 chevron">...</svg>
  </div>
</div>
```

### 3. Agent Status Indicator

**Location**: `/app/frontend/components/project/AgentStatus.tsx`

**Running State**:
- Dot color: `#67CB65` (green)
- Background: `rgba(103,203,101,0.125)`
- Text: "Agent is running..." in green
- Animated pulse

**Waiting State**:
- Dot color: `#5FD3F3` (blue)
- Background: `rgba(95,211,243,0.125)`
- Text: "Agent is waiting..." in blue
- Animated pulse

**HTML Structure**:
```html
<div class="flex items-center gap-[4px]">
  <div class="w-4 h-4 rounded-lg flex justify-center items-center animate-status-pulse"
       style="background-color:rgba(103,203,101,0.125);--status-pulse-color:#67CB6570;--status-pulse-transparent:#67CB6500">
    <div class="rounded-full w-2 h-2" style="background-color:rgb(103,203,101)"></div>
  </div>
  <span style="color:rgb(103,203,101)">Agent is running...</span>
</div>
```

### 4. Input Area Component

**Location**: `/app/frontend/components/project/AgentChatPanel.tsx`

**Container**:
- Background: `#1A1A1C`
- Border radius: `14px`
- Border: `1px solid #252526`
- Backdrop blur: `40px`

**Textarea**:
- Min height: `64px`
- Max height: `200px`
- Placeholder: "Message Agent"
- Placeholder color: `rgba(255,255,255,0.5)`
- Font size: `16px`

**Bottom Bar Actions**:
- Left: Attachment icon, GitHub button, Summarize button, Ultra toggle
- Right: Microphone icon, Send/Stop button

**Send Button**:
- Circular, white background
- Arrow up icon (dark)

**Stop Button** (when running):
- Same circular style
- Square icon inside

**Waiting State Input**:
- Border-beam animation
- Submit button instead of Send

### 5. Preview Panel Component

**Location**: `/app/frontend/components/project/PreviewPanel.tsx`

**Header**:
- Title: "App Preview"
- Actions: Refresh, Open in new tab, Close

**Resizable Handle**:
- Default: `#242424`
- Hover: `#00CCAF` with 60% opacity
- Drag: `#00CCAF`

**HTML Reference for Resizer**:
```html
<div class="group hover:bg-[#00CCAF]/60 data-[resize-handle-state=drag]:bg-[#00CCAF]/60 
            transition-colors duration-200 bg-[#242424] hidden md:flex">
  <div class="group-hover:bg-[#00CCAF] z-10 min-w-2 min-h-6 border bg-[#242424] border-[#242424] 
              rounded-md hover:bg-[#00CCAF] hover:border-[#00CCAF]">
  </div>
</div>
```

### 6. Code Button & Preview Button

**Location**: Top right of chat area

**Style**:
- Background: Transparent or subtle
- Border: `1px solid #252526`
- Border radius: `8px`
- Icon + text layout

**Code Button Behavior**:
- When clicked, fetches code-server credentials from `/api/projects/:id/code-server`
- Opens CodeServerDialog with URL and password
- User can copy URL and password
- "Open in Browser" button opens code-server in new tab
- Code-server workspace is isolated per project at `/workspace/projects/{projectId}`

---

## Button Behaviors

| Element | Running State | Waiting State |
|---------|---------------|---------------|
| Tab indicator | Green pulsing dot (when agent is running) | Blue pulsing dot (when agent is waiting) |
| Status text | "Agent is running..." (green) | "Agent is waiting..." (blue) |
| Input button | Stop (/app/sample_assets/assets/svg/stop.svg) | Submit (/app/sample_assets/assets/svg/arrow.svg) |
| Preview button (/app/sample_assets/assets/svg/preview.svg) | Opens split view | Opens split view |
| Code button (/app/sample_assets/assets/svg/code.svg) | Placeholder (no action) | Placeholder (no action) |
| Home tab | Returns to home (keeps tab) | Returns to home (keeps tab) |
| "+" button | Opens home for new project | Opens home for new project |

---

## Important Notes

1. **Particle Background**: The animated particle background is already implemented and should be preserved in HomeView.

2. **Tab System**: Tabs open views inside the page, not browser tabs. The system is already implemented in `/app/frontend/lib/store/tabs.ts`.

3. **Fonts Location**: Fonts already are in `/app/frontend/public/fonts/` with the following files:
   - Brockmann-Regular-CFBdZhjj.otf
   - Brockmann-Medium-DWnaEPVI.otf
   - Brockmann-SemiBold-DN9dX72F.otf
   - ndot-47-inspired-by-nothing-D5y43lnK.otf
   - JetBrainsMono[wght].ttf
   - codicon-DCmgc-ay.ttf
   - Inter-VariableFont_opsz,wght.ttf

4. **Exact Visual Match**: This is NOT inspiration - it's a pixel-perfect visual cloning task. All colors, spacing, animations must match exactly.

5. **Code-Server Integration**: 
   - Code-server runs on port 8080 with password authentication
   - Each project gets an isolated workspace at `/workspace/projects/{projectId}`
   - When "Code" button is clicked, a dialog shows the URL and password
   - Users can copy credentials and open code-server in a new browser tab
   - Backend API endpoint: `GET /api/projects/:id/code-server`

---

## Sample Assets Location

All reference HTML files and fonts are in: `/app/sample_assets/`

- `Agent_Running_Project_Full_Width.html`
- `Agent_Running_Project_Split_Screen.html`
- `Agent_Waiting_Project_Split_Screen.html`
- `main-BirpqjJG.css` (compiled Tailwind CSS)


---

## WebSocket Implementation

### Overview
The application now uses WebSocket for real-time communication between the frontend and backend during project builds.

### Backend WebSocket Route
- **Endpoint**: `/api/build/:projectId`
- **Authentication**: JWT token passed as query parameter
- **Protocol**: WebSocket over HTTP/HTTPS
- **Proxy**: Python server.py proxies WebSocket connections to Fastify backend

### Frontend WebSocket Integration

#### Files Created:
1. `/app/frontend/lib/websocket.ts` - WebSocket service class
2. `/app/frontend/hooks/useProjectWebSocket.ts` - React hook for WebSocket management
3. `/app/frontend/hooks/useNetworkUrl.ts` - Hook for network-accessible URLs

#### Message Types:
- `status` - Pipeline status updates
- `progress` - Step-by-step progress messages
- `complete` - Build completion
- `error` - Error messages
- `step` - Detailed step information with status

#### Agent Status States:
- `idle` - No active build
- `running` - Build in progress
- `waiting` - Waiting for user input (future implementation)

### Project Creation Flow

1. User enters prompt in PromptInput component
2. Project is created via API (`POST /api/projects`)
3. New project tab is opened in ProjectExecutionView
4. WebSocket connection is automatically established
5. Backend starts build pipeline
6. Real-time messages stream to frontend
7. UI updates dynamically based on message type

### Preview URL

The preview URL is dynamically generated based on the current network location:
- Uses `window.location.host` to ensure network accessibility
- Format: `${protocol}//${host}/preview/${projectId}`
- Works across different network configurations (localhost, LAN, WAN)

### Code Server Integration

Code-server credentials are fetched when user clicks "Code" button:
- **Endpoint**: `GET /api/projects/:id/code-server`
- Returns URL and password for isolated workspace
- Each project has workspace at `/workspace/projects/{projectId}`


- Font files (.otf)
