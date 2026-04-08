Update the Finly Ledger page so it keeps the same core functionality and structure already implemented, but significantly improves the daily header bar, entry-level amount colors, category styling, and the overall premium visual quality of the page.

Do not change or break any existing functionality.
This is a visual and interaction refinement of the Ledger page, not a logic rewrite.

The page must remain compatible with:

daily view
weekly view
monthly view
annual view
custom range
bookmarks
long-press delete with confirmation
savings tracking
transaction grouping
existing account/category logic
Primary Fixes Required
1. Daily view header must match weekly/monthly/annual summary style

Currently, weekly, monthly, and annual grouped headers look acceptable, but the daily date header is still incomplete and visually inconsistent.

Update required

For each daily date group, the top bar must show:

Income in green
Expense in red
Savings in magenta
Balance in orange

This must appear in the same grouped header bar for each day, just like the weekly/monthly grouped summary style.

Example

For a date group like:

08
Wed
04.2026

the same header row or compact grouped header card must also clearly display:

Income ₹X
Expense ₹Y
Savings ₹Z
Balance ₹N
Important

The daily header should no longer show only date and balance.
It must show all four financial metrics in the same premium style used in the week/month/year header.

2. Daily header bar visual design

Redesign the daily group header so it feels richer and more aligned with Finly’s premium theme.

Design direction

Create a two-zone premium header for each day:

Left zone
Date number in bold
Day chip
Month and year
subtle divider or timeline indicator if needed
Right or lower compact summary zone
Income
Expense
Savings
Balance

This can be:

on the same horizontal bar if space allows
or in a compact second line beneath the date row
but it must still feel like one elegant grouped header block
Style guidance
use soft gradient or tinted card surface
add subtle glass-like or elevated container styling
preserve dark theme
use premium spacing and alignment
no cluttered text packing
ensure strong readability on mobile first
3. Entry amount colors must reflect transaction type

Currently, transaction amounts in the ledger rows are too neutral.

Update required

Apply amount color based on transaction type:

Expense transaction amount → red
Income transaction amount → green
Savings transfer amount → magenta
internal balance-neutral transfers → theme-consistent neutral/accent if applicable
Examples
Spending ₹42 for breakfast → show ₹42 in red
Salary credit ₹75,000 → show ₹75,000 in green
Savings contribution ₹5,000 → show ₹5,000 in magenta
Important

This color coding should apply inside the transaction rows themselves, not only in summary headers.

4. Category styling must feel more premium and unique

Currently, category labels feel too plain and generic.

Update required

Keep the same category logic and icons already used in Finly, but redesign how categories are visually presented so they feel premium, distinctive, and more attractive.

Do not change
category names
category mapping
icon system logic
Improve
category label styling
icon container styling
typography hierarchy
spacing between category label and subtitle
visual richness of the row
Design ideas

Use one or more of these refinements:

small tinted icon background per category
soft category accent glow
subtle colored vertical line or category accent marker
slightly richer category text tint instead of plain white
category/subcategory shown as layered typography
more premium transaction card depth and contrast
Goal

The Ledger page should feel visually memorable and premium, not just a list of white text rows.

5. Maintain white text only where appropriate

Primary transaction titles can remain bright and readable, but the overall row styling should not look flat.

Typography rules
transaction title → prominent bright white / high contrast
account name / subtitle → softer muted theme tone
category label → subtly tinted based on category accent
amount → color by transaction type
date metadata → elegant subdued tone
bookmarked icon active/inactive clearly visible
6. High-end Ledger visual redesign while preserving functionality

Enhance the Ledger page into a more elegant and premium financial view without changing the behavior.

Keep functionality exactly as is
daily/weekly/monthly/annual/custom filters
grouped views
long press delete
bookmark on row
floating add transaction button
savings calculations
account mapping
goal-linked savings compatibility
Visual enhancement goals
richer grouped headers
more premium card styling
better color hierarchy
better transaction scanability
stronger visual separation between days/weeks/months
more elegant balance between data density and beauty
7. Premium ledger design suggestions to implement

Use the current Finly dark-theme style, but elevate it with:

soft radial gradients
subtle neon-fintech highlights
low-opacity colored accents
elegant grouped summary capsules
better shadow depth
smooth rounded corners
refined divider system
subtle timeline feel for day groups
premium alignment for money values
Optional styling ideas
daily headers as glowing compact summary chips
transaction rows with subtle hover/press/active states
left-side visual timeline connector for grouped date transactions
category icon containers with premium soft color coding
micro-highlights for important financial values

Do not overdo glow or decorations. Keep it polished and credible.

8. Daily header summary layout requirement

For each daily date section, use this financial order consistently:

Income in green
Expense in red
Savings in magenta
Balance in orange

This order must remain fixed across:

daily
weekly
monthly
annual

That way all grouped views feel consistent.

9. Transaction row example behavior

Each row should visually communicate the transaction type.

Example expense row
category: Food
title: Sagar 2 Idly
subtitle: PG GPay Axis
amount: ₹42 in red
Example income row
category: Salary
title: Salary Credit
subtitle: SBI Salary
amount: ₹75,000 in green
Example savings row
category: Savings
title: Bike Goal Contribution
subtitle: Savings Account
amount: ₹10,000 in magenta
10. Preserve all existing logic

Do not change any underlying behavior related to:

calculations
grouping
bookmarks
delete actions
transfers
goals
recurring handling
summaries
filters
accounts
transaction creation/editing

Only improve:

daily grouped header completeness
entry color logic
premium visual design
category presentation
ledger visual appeal
11. Required Figma deliverables

Create updated Ledger designs for:

Daily view with complete date header showing:
Income
Expense
Savings
Balance
Weekly view aligned to same color rules
Monthly view aligned to same color rules
Annual view aligned to same color rules
Transaction row variants for:
income
expense
savings
bookmarked
non-bookmarked
Premium category styling variants
Enhanced grouped header component reusable across all period views
Responsive variants for:
Android
iPhone
tablet
desktop
12. Visual style direction

Use the existing Finly visual language, but elevate it.

Required color meaning
income = green
expense = red
savings = magenta
balance = orange
Overall visual tone
premium fintech
dark luxury theme
subtle futuristic depth
elegant but practical
highly readable
emotionally satisfying to scan
visually unique and catchy for repeated daily use

The final Ledger page should feel like one of Finly’s strongest screens.

Short Figma input version

Refine the Finly Ledger page without changing any existing functionality. Keep the same Finly premium dark theme, layout structure, filters, bookmarks, long-press delete, savings logic, and grouped views. Fix the daily view so each date header shows Income, Expense, Savings, and Balance exactly like the weekly/monthly/annual grouped summary style. Use fixed colors everywhere: Income green, Expense red, Savings magenta, Balance orange. Also apply transaction-type color to entry amounts in rows, so expenses are red, income is green, and savings entries are magenta. Keep the same category icons and logic, but redesign the category presentation, typography, icon containers, spacing, and row styling to feel more premium, elegant, unique, and visually rich within the existing Finly design system. Improve grouped headers, transaction card styling, separators, and overall ledger polish while preserving all logic and interactions.