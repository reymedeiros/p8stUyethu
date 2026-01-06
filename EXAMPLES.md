# Usage Examples

## Example 1: Simple Todo List Application

### Step 1: Create Project

In the UI:
- Click **"+ New Project"**
- Name: "Todo App"
- Description: "Simple task manager"
- Prompt: "Create a todo list application"

### Step 2: Generate Code

In the AI Builder panel, enter:

```
Build a todo list application with the following features:
- Add new todo items with a text input and button
- Display all todos in a list
- Each todo has a checkbox to mark as complete
- Each todo has a delete button
- Completed todos should be styled differently (strikethrough)
- Use vanilla JavaScript, HTML, and CSS
- Clean, modern styling with a centered layout
- Use localStorage to persist todos
```

Click **"Build"** and wait for completion (30-60 seconds).

### Step 3: Review Generated Files

You should see files like:
- `index.html` - Main HTML structure
- `style.css` - Styling
- `app.js` - Todo logic and localStorage

### Step 4: Iterate and Improve

Add more features:

```
Add the following enhancements to the existing todo app:
- Add a filter to show all/active/completed todos
- Add a counter showing number of active todos
- Add a "Clear completed" button
- Improve styling with better colors and spacing
```

---

## Example 2: Weather Dashboard

### Initial Prompt

```
Create a weather dashboard with:
- City search input
- Display current weather (temperature, conditions, humidity, wind)
- 5-day forecast
- Weather icons for conditions
- Use OpenWeatherMap API (mock data for now)
- Responsive design
- Use HTML, CSS, and vanilla JavaScript
```

### Iteration 1: Add Features

```
Add these features to the weather dashboard:
- Geolocation button to get user's location
- Temperature unit toggle (Celsius/Fahrenheit)
- Local storage to remember last searched city
- Loading spinner while fetching data
```

### Iteration 2: Improve UI

```
Improve the weather dashboard UI:
- Add gradient background based on weather condition
- Better card design with shadows
- Animated weather icons
- Mobile-responsive layout
```

---

## Example 3: Calculator

### Simple Version

```
Build a calculator with:
- Number buttons (0-9)
- Basic operations (+, -, *, /)
- Clear, equals, and decimal point buttons
- Display screen
- Clean, modern design
- Use HTML, CSS, and vanilla JavaScript
```

### Advanced Version

```
Enhance the calculator with:
- Keyboard support (numbers and operators)
- Memory functions (M+, M-, MR, MC)
- Percentage button
- Square root function
- Operation history display
- Improved styling with CSS Grid
```

---

## Example 4: Markdown Editor

### Initial Prompt

```
Create a markdown editor with:
- Split view: editor on left, preview on right
- Live preview as you type
- Basic markdown support (headings, bold, italic, links, lists)
- Toolbar with formatting buttons
- Use a markdown parsing library
- Clean, editor-like interface
```

### Iteration: Add Features

```
Add to the markdown editor:
- Export to HTML button
- Save/load documents (localStorage)
- Word and character count
- Dark mode toggle
- Syntax highlighting in preview
- Full-screen mode
```

---

## Example 5: Recipe Manager

### Full Featured Prompt

```
Build a recipe manager application with:

Structure:
- Recipe list page
- Recipe detail page
- Add/edit recipe form

Features:
- Add new recipes with name, ingredients, instructions, prep time, cook time
- Edit existing recipes
- Delete recipes
- Search recipes by name
- Filter by category (breakfast, lunch, dinner, dessert)
- Mark recipes as favorites
- Image upload for recipes (optional placeholder)

Storage:
- Use localStorage for data persistence

Design:
- Card-based layout for recipe list
- Responsive design
- Clean, modern styling
- Use CSS Grid or Flexbox

Tech:
- Use React if possible, otherwise vanilla JavaScript
- HTML5 and CSS3
```

---

## Example 6: Expense Tracker

### Comprehensive Prompt

```
Create an expense tracker application:

Core Features:
- Add expenses (amount, category, date, description)
- Display list of all expenses
- Delete expenses
- Edit expenses
- Calculate total expenses
- Filter by date range
- Filter by category

Categories:
- Food
- Transport
- Entertainment
- Bills
- Shopping
- Other

Visualization:
- Show total by category (bar chart or simple list)
- Monthly summary

Data Storage:
- Use localStorage

UI/UX:
- Form to add expenses
- Table or card view for expense list
- Summary section at top
- Responsive design
- Modern, clean styling

Technology:
- HTML, CSS, JavaScript
- Use Chart.js for visualization if possible
```

---

## Example 7: Portfolio Website

### Static Portfolio Prompt

```
Build a personal portfolio website with:

Pages/Sections:
- Hero section with name and title
- About section with bio
- Skills section with skill list
- Projects section with project cards (3-4 projects)
- Contact section with email form

Design:
- Single-page application with smooth scroll
- Modern, professional design
- Responsive layout (mobile-friendly)
- Animated entrance effects
- Color scheme: use professional colors

Features:
- Navigation menu with links to sections
- Project cards with image, title, description, tech stack
- Contact form (non-functional, just UI)
- Social media links (GitHub, LinkedIn, Twitter)

Technology:
- HTML5, CSS3, vanilla JavaScript
- No frameworks needed
```

---

## Example 8: Note Taking App

### Feature-Rich Prompt

```
Build a note-taking application with:

Core Features:
- Create new notes
- Edit existing notes
- Delete notes
- Search notes by title or content
- Sort notes by date or title
- Pin important notes

Note Structure:
- Title
- Content (multiline text)
- Created date
- Last modified date
- Tags (optional)

UI Components:
- Sidebar with note list
- Main editor area
- Search bar
- Tag filter

Features:
- Rich text editing (bold, italic, lists)
- Auto-save while typing
- localStorage persistence
- Dark mode toggle

Design:
- Clean, minimal interface
- Responsive layout
- Similar to Apple Notes or Google Keep

Technology:
- React (if possible) or vanilla JavaScript
- HTML, CSS
```

---

## Example 9: Pomodoro Timer

### Timer App Prompt

```
Create a Pomodoro timer application:

Timer Modes:
- Work session (25 minutes default)
- Short break (5 minutes default)
- Long break (15 minutes default)

Features:
- Start/pause/reset buttons
- Display time in MM:SS format
- Auto-switch between work and break sessions
- Sound notification when timer ends
- Session counter (tracks completed pomodoros)
- Customizable timer durations

Settings:
- Adjust work duration
- Adjust break durations
- Toggle sound notifications

Visualization:
- Circular progress indicator
- Current mode display
- Session count display

Design:
- Centered, focused layout
- Large, readable timer display
- Minimal, distraction-free interface
- Smooth animations

Technology:
- HTML, CSS, JavaScript
- Use CSS animations for progress circle
```

---

## Example 10: Quiz Application

### Interactive Quiz Prompt

```
Build an interactive quiz application:

Structure:
- Welcome screen
- Quiz questions screen
- Results screen

Quiz Features:
- Multiple choice questions (4 options each)
- 10 questions total
- Timer for each question (30 seconds)
- Progress indicator
- Score tracking
- Review wrong answers at end

Questions:
- Create sample questions about general knowledge
- Mix of difficulty levels

Features:
- Next/Previous navigation
- Submit button on last question
- Show correct answer after submission
- Calculate final score
- Option to retake quiz

UI/UX:
- Clean, card-based design
- Highlight selected answer
- Show timer countdown
- Progress bar
- Results page with score percentage
- Review section showing all questions and answers

Technology:
- HTML, CSS, JavaScript
- Store questions in JSON format
- Responsive design
```

---

## Tips for Better Prompts

### 1. Be Specific About Structure

Instead of:
```
Build a blog
```

Use:
```
Build a blog with:
- Homepage listing all posts
- Individual post page
- About page
- Contact form
- Posts stored in array/localStorage
```

### 2. Specify Technology Preferences

```
Use React with functional components and hooks
Use vanilla JavaScript, no frameworks
Use HTML5 semantic elements
Include CSS Grid for layout
```

### 3. Define Data Structure

```
Each task should have:
- id (number)
- title (string)
- completed (boolean)
- createdAt (date)
```

### 4. Describe UI/UX

```
Design should be:
- Minimal and clean
- Dark theme
- Mobile-responsive
- With smooth animations
```

### 5. Break Complex Projects

Don't:
```
Build a complete e-commerce platform with cart, checkout, admin panel, etc.
```

Do:
```
Step 1: Build product listing with search and filters
Step 2: Add shopping cart functionality
Step 3: Create checkout form
```

### 6. Provide Context for Iterations

Instead of:
```
Add dark mode
```

Use:
```
Add a dark mode toggle to the existing todo app that:
- Switches between light and dark themes
- Saves preference to localStorage
- Changes background, text, and card colors
```

---

## Common Patterns

### Pattern 1: CRUD Application

```
Create a [ITEM] manager with:
- Create new [ITEM]
- Read/list all [ITEMS]
- Update existing [ITEM]
- Delete [ITEM]
- Search/filter [ITEMS]
- localStorage persistence
```

### Pattern 2: Dashboard

```
Build a [TOPIC] dashboard with:
- Multiple data cards
- Charts/visualizations
- Filter options
- Responsive grid layout
- Real-time updates (or mock data)
```

### Pattern 3: Form Application

```
Create a [TYPE] form with:
- Input fields for [LIST FIELDS]
- Validation for each field
- Submit button
- Display submitted data
- Error messages
- Success confirmation
```

### Pattern 4: Game

```
Build a [GAME NAME] game with:
- Game board/canvas
- Player controls
- Score tracking
- Game over condition
- Restart button
- Instructions
```

---

## Troubleshooting Prompts

### If Output is Too Simple

Add more details:
```
The current app is too basic. Enhance it with:
- [Specific feature 1]
- [Specific feature 2]
- Better error handling
- Loading states
- Improved styling
```

### If Code Has Errors

```
Fix the following issues in the current code:
- [Describe error 1]
- [Describe error 2]
Also add proper error handling and validation
```

### If Styling Needs Improvement

```
Improve the visual design:
- Use a modern color palette
- Add spacing and padding
- Improve typography
- Add hover effects
- Make it mobile-responsive
```

---

## Model-Specific Tips

### For Phi-3 Mini (3.8B)
- Keep prompts concise
- One feature at a time
- Simple applications work best
- Avoid complex logic

### For Qwen 2.5 (7B)
- Can handle moderate complexity
- Good for full applications
- Clear structure helps
- Can understand context

### For LLaMA 3 / DeepSeek Coder (7-8B)
- Handles complex applications
- Good code quality
- Can implement advanced features
- Better at following detailed specs

---

Remember: Start simple, iterate, and build up complexity!
