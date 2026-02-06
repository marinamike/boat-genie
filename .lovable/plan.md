

## Password Visibility Toggle

I'll add an eye icon toggle button to all password input fields, allowing users to show/hide their password while typing.

### Files to Modify

1. **`src/pages/Login.tsx`**
   - Add `showPassword` state variable
   - Import `Eye` and `EyeOff` icons from lucide-react
   - Wrap the password Input in a `relative` container
   - Add toggle button with eye icon positioned inside the input
   - Dynamically switch input type between "password" and "text"

2. **`src/pages/Signup.tsx`**
   - Same implementation as Login page

### Implementation Details

The password field will be wrapped in a relative div, with an absolutely-positioned button on the right side containing the eye icon. Clicking the button toggles between showing and hiding the password.

```text
┌─────────────────────────────────┐
│ ••••••••••••              👁    │
└─────────────────────────────────┘
         ↑                   ↑
    Password hidden     Toggle button
```

### Technical Approach

```tsx
// State
const [showPassword, setShowPassword] = useState(false);

// Password field with toggle
<div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    className="h-12 pr-10"  // padding-right for icon
    ...
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

### Accessibility
- Button uses `type="button"` to prevent form submission
- Icons provide visual feedback for current state
- Clickable area is touch-friendly

