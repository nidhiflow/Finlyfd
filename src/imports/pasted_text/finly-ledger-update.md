Update the Finly Ledger page by keeping the same premium dark-theme UI, gradients, typography style, spacing language, card styling, and icon system already used in the existing Finly application. Do not simplify it into a generic plain ledger. Keep the earlier Finly visual identity intact and only apply the requested UI and functionality refinements.

This change must feel like a natural extension of the current Finly design system, not a redesign into another app style.

Primary Goal

Refine the Ledger page so that:

it keeps the same existing Finly UI style
daily transaction groups show Income, Expense, Savings, and Balance in the header of each day
the same logic is applied consistently in:
Daily
Weekly
Monthly
Annually
colors match the app theme better
text colors and entry colors feel premium and readable
existing category icons remain unchanged
the page looks polished, not plain or vague
1. Preserve Existing Finly UI Style
Important rule

Do not replace the current Finly design language with a minimal generic layout.

Keep the existing Finly design elements
existing dark gradient background
existing card glow language
current spacing rhythm
existing transaction row styling
current premium fintech look
current bookmark icon behavior
current category icon system
current rounded corners and component depth
existing accent color palette where appropriate
Design intent

This should look like:

same Finly app
same visual brand
same design family
but with improved ledger grouping, better header information, and cleaner data hierarchy
2. Daily Header Must Show Income, Expense, Savings, and Balance

For every daily transaction group header, keep the existing date layout:

Date number in bold, for example 08
Day chip, for example Wed
Month and year, for example 04.2026

On the same header row, also show the day-level totals for:

Income
Expense
Savings
Balance
Required behavior

Each day header should dynamically calculate and display:

total income for that day
total expense for that day
total savings moved on that day
final day balance / net total
Color rules
Income → green
Expense → red
Savings → theme-consistent accent color, such as cyan / purple / blue based on Finly palette
Balance → neutral highlight or premium light tone based on current theme
Layout expectation

Keep the date visible and strong on the left, and show the daily summary neatly on the same line or in a compact stacked structure aligned to the right, without making the header cluttered.

Example visual structure

Left side:

08
Wed
04.2026

Right side:

Income ₹X
Expense ₹Y
Savings ₹Z
Balance ₹N

This should feel elegant, compact, and consistent with the current UI.

3. Apply the Same Summary Logic to All Period Views
Daily

Each date group should show:

Income
Expense
Savings
Balance
Weekly

Each week group should show:

Income
Expense
Savings
Balance
Monthly

Each month group should show:

Income
Expense
Savings
Balance
Annually

Each year or month-within-year group should show:

Income
Expense
Savings
Balance
Requirement

Do not change the filtering behavior. Only enhance the grouped header UI and maintain the same financial summary logic consistently across all views.

4. Keep the Same Category Icons

Use the same category icons already available in Finly.

Do not
replace icons with new generic icons
introduce a different icon family
change category mapping
Do
keep current category icons
improve spacing/alignment if needed
ensure icons remain crisp and consistent with the app theme
5. Improve Transaction Row Colors and Typography
Current issue

The transaction entry text looks too plain and flat, especially with basic white text, and does not match the richer UI of the rest of the app.

Required update

Refine the transaction row styling to better match Finly’s original premium theme.

Typography improvements
transaction title should be more prominent
secondary text like account name or subcategory should be softer and muted
amount should stand out clearly
bookmarked state should remain visually clear
Color improvements

Use theme-consistent colors instead of plain flat white everywhere.

Suggested approach:

primary text: soft bright white with premium tone
secondary text: muted grey-blue / slate based on theme
category labels: subtle tinted tone
amount colors:
expense amounts can remain neutral white in rows if global logic requires, but day header summary must clearly use red for expense
income values can be green in summary areas
savings values use theme accent
dividers and separators should be subtle and elegant
Design expectation

Rows should feel richer, cleaner, and more polished while preserving readability.

6. Keep Layout Same, Only Enhance It
Requirement

The overall layout is acceptable. Do not rebuild it unnecessarily.

Only improve:

day/week/month/year group headers
text hierarchy
color consistency
entry styling
header summary information
theme alignment

This is a UI refinement, not a structural redesign.

7. Daily Group Styling

For each day group:

preserve current grouping style
keep clean spacing between rows
keep existing Finly card/list appearance
add subtle separator or spacing between date groups
make the header feel more premium using current app styling

Possible enhancement:

use a soft tinted header strip or compact elevated row for each date header
keep it subtle, not bulky
8. Savings Visibility

If there is any savings-related movement on a given day:

include it in the day header totals
show it in weekly/monthly/annual summaries as well
keep savings visually distinct from expense and income

If there is no savings on a given day:

show ₹0 or hide gracefully depending on best UI clarity, but maintain consistency
9. Maintain All Existing Functionalities

These changes must not alter or break:

transaction creation
editing
bookmark behavior
long press delete behavior
account balance calculations
recurring logic
goal-linked savings logic
filters for daily/weekly/monthly/annually/custom
any other existing app behavior

This update must only improve:

grouped header visibility
theme consistency
transaction row visual polish
10. Required Figma Deliverables

Create updated Ledger page variants for:

Daily view with date header showing:
Income
Expense
Savings
Balance
Weekly view with same summary logic
Monthly view with same summary logic
Annual view with same summary logic
Transaction rows using:
existing category icons
improved text hierarchy
improved theme-consistent colors
States for:
no savings in a period
only expense in a period
mixed income/expense/savings in a period
bookmarked vs unbookmarked rows
11. Visual Direction

Use the existing Finly design language:

premium dark UI
subtle gradients
soft glows where already used
elegant rounded cards
rich typography hierarchy
theme-consistent muted text
high readability
no flat generic redesign
no plain ledger aesthetic

The final Ledger page should feel like the same Finly product, only more informative, more polished, and better aligned with the rest of the application.

Short Figma Input Version

Update the Finly Ledger page by keeping the same existing Finly premium dark-theme UI, typography, gradients, spacing, card style, bookmark behavior, and category icons. Do not redesign it into a simple generic ledger. Refine the page so that in Daily view, each date header shows the date number, day, month-year, and on the same header also shows day totals for Income, Expense, Savings, and Balance. Income must be green, Expense red, Savings use a theme-consistent accent color, and Balance use a neutral highlight color. Apply the same summary logic to Weekly, Monthly, and Annually views as well. Improve transaction row typography, spacing, and colors to match the existing Finly theme instead of plain white text. Keep the current layout structure, only refine the grouped headers, color system, and visual polish. Preserve all existing functionality including bookmarks, delete on long press, savings logic, filters, and transaction behavior.