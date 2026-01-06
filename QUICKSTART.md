# Quick Start Guide

## First Time Setup (5 minutes)

### 1. Access the Application

Open your browser and navigate to:
```
http://YOUR_SERVER_IP:3000
```

### 2. Create Account

1. Click "Register"
2. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Password: Create a secure password
3. Click "Register"

You'll be automatically logged in.

### 3. Create Your First Project

1. Click the **"+"** button in the sidebar
2. Fill in the form:
   - **Name**: "My First App"
   - **Description**: "A simple todo list"
   - **Prompt**: "Create a todo list app with add, delete, and mark complete features"
3. Click "Create"

### 4. Generate Code

1. Your new project will be selected automatically
2. In the **AI Builder** panel (right side), enter a detailed prompt:
   ```
   Build a simple todo application with:
   - Add new todo items
   - Mark items as complete
   - Delete items
   - Use vanilla JavaScript and HTML
   ```
3. Click "Build"
4. Watch the logs panel as the AI works:
   - Planning the project
   - Generating code files
   - Saving files

### 5. View Generated Files

1. In the **Files** panel (middle-left), you'll see the file tree
2. Click on any file to view/edit it
3. The Monaco editor (main area) shows the code with syntax highlighting
4. You can edit any file directly

### 6. Understanding the UI

```
┌──────────────────────────────────────────────────────────┐
│                    Emergent Clone                        │
├────────┬──────────────────────────┬──────────────────────┤
│        │                          │                      │
│ Proj-  │                          │   AI Builder Panel   │
│ ects   │   Monaco Code Editor     │   ┌──────────────┐   │
│        │   (Edit your files)      │   │ Prompt Input │   │
│ • App1 │                          │   └──────────────┘   │
│ • App2 │                          │   [Build Button]     │
│        │                          │                      │
│ Files  │                          │   ─────────────────  │
│ ├─src  │                          │                      │
│ │ └─js │                          │   Logs Panel         │
│ └─html │                          │   • Planning...      │
│        │                          │   • Generating...    │
│        │                          │   • Complete!        │
└────────┴──────────────────────────┴──────────────────────┘
```

## Common Use Cases

### Building a Simple Website

**Prompt Example**:
```
Create a personal portfolio website with:
- Homepage with introduction
- About section
- Projects gallery
- Contact form
- Responsive design with CSS
- Use only HTML, CSS, and JavaScript
```

### Building a Web App

**Prompt Example**:
```
Build a note-taking application with:
- Create, edit, delete notes
- Markdown support
- Local storage persistence
- Search functionality
- Dark mode toggle
- Use React if possible, otherwise vanilla JS
```

### Building a Game

**Prompt Example**:
```
Create a simple snake game with:
- Canvas-based graphics
- Keyboard controls
- Score tracking
- Game over screen
- Restart functionality
- Use vanilla JavaScript
```

### Building a Dashboard

**Prompt Example**:
```
Build a data dashboard with:
- Multiple chart types (line, bar, pie)
- Mock data
- Responsive grid layout
- Export to CSV functionality
- Use Chart.js or similar library
```

## Tips for Better Results

### 1. Be Specific

❌ **Bad**: "Make a website"

✅ **Good**: "Create a restaurant website with menu page, location map, contact form, and image gallery"

### 2. Specify Technology

❌ **Bad**: "Build an app"

✅ **Good**: "Build a todo app using React with hooks and CSS modules"

### 3. Break Down Complex Projects

Instead of:
```
Build a full e-commerce platform with cart, payments, and admin panel
```

Do this:
```
Step 1: Build product listing page with search and filters
Step 2: Add shopping cart functionality
Step 3: Add checkout form
```

### 4. Iterate and Refine

After initial generation:
```
Add a dark mode toggle to the existing application
Improve the CSS styling with better colors and spacing
Add input validation to the contact form
```

## Working with Generated Code

### Editing Files

1. Click on a file in the file tree
2. Edit directly in Monaco editor
3. Changes are auto-saved
4. View version history (coming soon)

### Running Applications

The Docker sandbox automatically runs your generated code.
Logs appear in the logs panel.

### Common File Types

- **HTML** (`.html`) - Web pages
- **CSS** (`.css`) - Styling
- **JavaScript** (`.js`) - Logic
- **JSON** (`.json`) - Configuration/data
- **Markdown** (`.md`) - Documentation

## Model Selection

### Recommended Models

**For Small Projects** (websites, simple apps):
- Phi-3 Mini (3.8B)
- Fast responses, good for simple tasks

**For Medium Projects** (interactive apps):
- Qwen 2.5 (7B)
- Balanced performance and quality

**For Complex Projects** (full applications):
- LLaMA 3 (8B)
- DeepSeek Coder (7B)
- Better reasoning and code quality

### Switching Models in LM Studio

1. Open LM Studio
2. Go to "Local Server" tab
3. Select different model from dropdown
4. Click "Reload Server"

## Keyboard Shortcuts

**Monaco Editor**:
- `Ctrl+S` / `Cmd+S` - Save (auto-save enabled)
- `Ctrl+F` / `Cmd+F` - Find
- `Ctrl+H` / `Cmd+H` - Find and replace
- `Ctrl+/` / `Cmd+/` - Toggle comment
- `Alt+Up/Down` - Move line up/down
- `Ctrl+D` / `Cmd+D` - Select next occurrence

## Troubleshooting

### Build is Slow

**Cause**: Large model or complex prompt

**Solution**:
- Use smaller model
- Break prompt into smaller tasks
- Be more specific to reduce token usage

### Generated Code Doesn't Work

**Solution**:
1. Check logs panel for errors
2. Review generated files for issues
3. Edit code manually to fix
4. Try regenerating with more specific prompt

### Files Not Appearing

**Solution**:
1. Check logs for generation errors
2. Refresh browser
3. Try rebuilding with simpler prompt

### Can't Connect to LM Studio

**Solution**:
1. Ensure LM Studio is running
2. Check server is started in LM Studio
3. Verify URL in backend settings
4. Test: `curl http://localhost:1234/v1/models`

## Best Practices

### 1. Start Simple

Begin with basic projects to understand the system.

### 2. Iterative Development

Build features one at a time:
```
Prompt 1: Create basic structure
Prompt 2: Add feature X
Prompt 3: Improve styling
Prompt 4: Add feature Y
```

### 3. Save Important Projects

Export/backup projects you want to keep.

### 4. Review Generated Code

Always review and understand the generated code.
The AI is a tool, not a replacement for understanding.

### 5. Provide Context

When iterating:
```
"Add a delete button to each todo item in the existing todo list"
```

Not just:
```
"Add delete button"
```

## Next Steps

### Learning Resources

1. **Web Development**:
   - MDN Web Docs: https://developer.mozilla.org
   - JavaScript.info: https://javascript.info

2. **React**:
   - Official Tutorial: https://react.dev/learn
   
3. **LM Studio**:
   - Documentation: https://lmstudio.ai/docs
   - Model Library: Built into LM Studio

### Project Ideas

1. **Beginner**:
   - Calculator
   - Weather app
   - Todo list
   - Stopwatch/timer
   
2. **Intermediate**:
   - Blog platform
   - Recipe manager
   - Expense tracker
   - Markdown editor
   
3. **Advanced**:
   - Project management tool
   - Chat application
   - Data visualization dashboard
   - Code editor

## Getting Help

- **Documentation**: See README.md
- **Deployment Issues**: See DEPLOYMENT.md  
- **GitHub Issues**: Report bugs and request features
- **Community**: Join discussions on GitHub

## Example: Complete Workflow

Let's build a calculator:

1. **Create Project**:
   - Name: "Calculator"
   - Description: "Simple calculator app"
   - Prompt: "Create a calculator with basic operations"

2. **Generate Code**:
   ```
   Build a calculator application with:
   - Number buttons (0-9)
   - Operation buttons (+, -, *, /)
   - Clear and equals buttons
   - Display screen
   - Clean, modern styling
   - Use HTML, CSS, and vanilla JavaScript
   ```

3. **Review Files**:
   - `index.html` - Structure
   - `style.css` - Styling
   - `script.js` - Logic

4. **Test** (in logs panel)

5. **Iterate**:
   ```
   Add keyboard support for number keys and operators
   ```

6. **Enhance**:
   ```
   Add memory functions (M+, M-, MR, MC)
   Improve styling with gradient background
   ```

7. **Done!** You have a working calculator.

---

**Remember**: The AI is your coding assistant. It's fastest when:
- Prompts are clear and specific
- Tasks are broken down
- You provide context for iterations

Happy building! 🚀