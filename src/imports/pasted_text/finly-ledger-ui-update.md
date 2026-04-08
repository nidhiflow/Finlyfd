Update the Finly Ledger page and align it with the existing Finly premium dark-theme design system.
Keep all current working functionality intact, but make the following refinements to improve consistency, readability, and interaction quality.

This update must not break any existing feature or logic. It is a UI refinement and interaction enhancement only.

Primary updates required
1. Use one fixed financial color system across the entire application

Apply the same color coding everywhere in the app, not just in Ledger.

Use these colors consistently across all screens:
Income → Green
Expense → Red
Savings → Magenta
Balance → Orange
Requirement

This color mapping must remain the same across:

Ledger
Dashboard
Reports
Goals
Account summaries
Transaction details
Charts and insights
Daily, weekly, monthly, annual summaries
Any other place where these values appear
Important

Do not use different colors for these financial meanings anywhere else in the app.
This must become a global Finly financial color standard.

2. Remove multiple category colors in Ledger

Currently the Ledger page uses different colors for categories like Food, Bills, Shopping, Investment, etc. That feels visually messy.

Update required

Remove category-specific bright colors from Ledger.

New rule

Use one common mild theme-based highlight color for all categories and subcategories in the Ledger page.

Desired styling
category text should be softly highlighted
subcategory text should be slightly more muted
both should feel elegant and readable
no separate bright color per category
no rainbow-style category treatment
Design expectation

Keep the typography placement exactly as it is if already good, but simplify the color treatment so it feels:

cleaner
more premium
less distracting
more consistent with a finance app
Suggested style direction
category label: mild accent tint from Finly theme
subcategory label: softer muted version of the same tint
account name / payment source: muted neutral tone
transaction title: premium bright white
amount: color by transaction type only
3. Keep transaction amount color based on type

Continue using transaction-type color in the rows:

Expense amount → Red
Income amount → Green
Savings amount → Magenta
Balance wherever shown → Orange
Important

Only the financial meaning should drive strong color.
Category labels should no longer use different colors.

4. Add expand/collapse behavior for each grouped section

Add a dropdown arrow or expand/collapse control for each grouped section in Ledger.

This should work for:

Daily groups
Weekly groups
Monthly groups
Annual groups where applicable
Required behavior

If user taps on the arrow or grouped header:

it should expand and show all transactions under that date/week/month
if tapped again, it should collapse and hide them
Example
Tap on 07 Tue 04.2026 → show all expenses/income/savings under that date
Tap again → collapse that group
Tap on 06 Mon 04.2026 → show all transactions for that date
Design expectation
use a clean chevron/down-arrow icon
arrow should rotate smoothly when expanded/collapsed
header remains clearly tappable
animation should be subtle and premium
expanded list should feel naturally attached to the header
5. Group header interaction design

Keep the grouped date/week/month header elegant and informative.

Each header should continue showing:

date / week / month / year label
Income
Expense
Savings
Balance
Add
expand/collapse arrow on the right or integrated into the header
visual cue that the whole header is interactive
Interaction
tap on header or arrow toggles expand/collapse
maintain same grouped totals whether collapsed or expanded
6. Preserve current layout quality

Do not disturb the good parts already achieved.

Preserve
transaction title placement
subcategory positioning
account name placement
grouped view structure
bookmark behavior
long press delete behavior
floating add transaction button
daily/weekly/monthly/annual/custom filters
all summary logic

Only refine:

category highlight styling
grouped expand/collapse interaction
global financial color consistency
7. Ledger row styling rules

For each transaction row:

Title
bright premium white
Category
mild common highlight tone
Subcategory
softer muted version of the same common highlight tone
Account/source text
muted neutral grey-blue tone
Amount
colored by transaction type:
income green
expense red
savings magenta
Bookmark
keep current active/inactive state
do not interfere with row expand/collapse behavior
8. Global design rule for financial colors

Apply this throughout the application as a design-system rule:

Global semantic colors
income-color = green
expense-color = red
savings-color = magenta
balance-color = orange

Use these same semantic colors in:

text
chips
summaries
graphs
legends
badges
cards
insights
headers
transaction values
goal progress summaries where relevant

Do not redefine these colors differently per page.

9. Expand/collapse behavior details

Add the following UX behavior:

Collapsed state
header visible
totals visible
transactions hidden
Expanded state
transactions visible
arrow rotated upward
content animates smoothly open
Optional refinement
allow only one group expanded at a time for cleaner UX
or
allow multiple open groups if that fits current logic better

Choose the approach that best matches Finly’s current interaction style, but keep it consistent.

10. Do not break functionality

This update must not alter:

transaction creation
editing
deletion logic
bookmarks
recurring logic
account balances
savings mapping
goal-linked savings
reports
filter behavior
period grouping calculations

This is a safe UI refinement only.

11. Required Figma deliverables

Create updated Ledger page states for:

Daily view collapsed
Daily view expanded
Weekly view collapsed
Weekly view expanded
Monthly view collapsed
Monthly view expanded
Annual view collapsed
Annual view expanded
Common category highlight style
Global financial color usage examples
Arrow interaction states:
default
pressed
expanded
collapsed
12. Visual direction

Use the existing Finly premium dark UI and improve clarity.

Style goals
elegant
structured
premium
calm
data-focused
not overly colorful
not messy
Ledger should feel
easier to scan
more professional
more interactive
more consistent with a mature finance product
Short Figma input version

Update the Finly Ledger page and global design system so Income is always green, Expense always red, Savings always magenta, and Balance always orange across the entire application. Remove different colors used for categories in Ledger and replace them with one common mild theme-based highlight color for category and a softer muted version for subcategory. Keep transaction titles white and keep amounts colored only by transaction type. Add expand/collapse behavior for each grouped section in Ledger so tapping the arrow or date/week/month header shows or hides all transactions for that section. Keep the current layout, typography placement, bookmark behavior, long-press delete, grouped summaries, and all existing logic intact. Use the existing Finly premium dark-theme design system and make the page feel clean, elegant, and consistent.