Redesign the Finly Ledger page to be simple, clean, financial-data focused, and easy to scan, inspired by the reference screenshot style, while still preserving Finly’s premium dark-theme identity and existing bookmark functionality.

This redesign must not break or alter any other existing app functionality.
It must only simplify the Ledger page structure, improve transaction readability, and update interaction behavior safely.

Primary Objective

Redesign the Ledger page so that it:

looks much simpler and cleaner
focuses on transaction history only
supports period-based viewing: daily, weekly, monthly, annually, custom
shows Income, Expense, Total, and Savings summary at the top
keeps bookmark option visible on each transaction
shows delete option only on long press
asks for confirmation before deleting
includes a floating add transaction button at the bottom-right
removes visual clutter like:
search transactions
saved filters
quick add
upcoming recurring section
recap cards
1. Ledger Page Layout Structure
Top Header

Design a clean top section with:

Back button
Current selected period label such as:
Apr 2026
This Week
FY 2026–27
Left/right navigation arrows for period switching
Optional bookmark overview icon only if needed globally
Clean top alignment and spacing
2. Summary Strip at Top

Directly below the header, add a compact summary row showing:

Income
Expenses
Savings
Balance / Total
Behavior

These values must dynamically update based on currently selected filter:

Daily
Weekly
Monthly
Annually
Custom
Design expectation
Use a clean horizontal stats strip
Clear typography hierarchy
Income in positive color tone
Expense in negative color tone
Savings in a distinct but subtle savings color
Balance/Total in neutral highlight color
Must remain compact and easy to scan
3. Filter Tabs Redesign

Replace current Ledger controls with simple period filter tabs:

Daily
Weekly
Monthly
Annually
Custom
Behavior
Only one tab can be active at a time
Active tab should be visually highlighted
Switching tab changes grouping and summary calculations
Custom opens date range picker
Remove these from Ledger page

Completely remove from this page:

Search transactions bar
Saved filters
Quick add shortcuts
Recap
Upcoming recurring section
Extra clutter not related to transaction history display
4. Transaction Grouping and List Design

The Ledger page should display transaction history grouped clearly based on selected filter.

Daily view

Group transactions by day.

For each date section, show:

Date number in bold
Day name such as Fri, Mon
Month and year
Day-level totals:
expense total
income total
optional savings transferred that day
Example date header
10
Fri
04.2026
Transaction row structure

Each transaction row should show:

category icon
category/subcategory
transaction title
account name / payment source
amount
bookmark icon
Design expectation
clean stacked rows
readable amounts
strong spacing
visually separated day groups
elegant, minimal financial ledger feel
5. Day-to-Day Visual Separation

Between one date group and the next, add a subtle but attractive divider treatment.

Possible options:

soft spacing gap
thin divider line
faint glow separator
small date-section card separator
Requirement

It should look elegant and match Finly’s design language, while clearly separating one day’s transactions from another.

6. Weekly, Monthly, Annual Views
Weekly view

Group transactions by week:

Week label
week start and end date
weekly income, expense, savings, balance
expandable or scrollable transaction list
Monthly view

Group transactions by month:

month title
monthly totals
transaction list under each month
Annual view

Group by month within the selected year, or summary-first approach:

yearly totals at top
month-by-month breakdown below
Custom view

Allow user to select any date range and show:

summary for chosen range
grouped transactions in the same visual style
7. Savings Column / Savings Tracking

Add Savings as a top summary metric and ensure it works correctly in Ledger.

Required behavior

If a transaction or transfer is moved into a savings account:

it should be counted under Savings
it should not appear as a regular expense in a misleading way
it should be visually understandable as money moved for saving
Design expectation

Savings-related entries can have:

a small savings badge/icon
separate visual label such as:
moved to savings
savings transfer
goal savings contribution

This should also align with goal functionality if goals are tagged later.

8. Bookmark Functionality

Keep the bookmark option already available in the current UI.

Behavior
Bookmark icon should remain visible on each transaction row
Single tap on bookmark toggles saved/unsaved state
Show active and inactive visual states
Bookmark should not interfere with row tap or long press actions
9. Delete Only on Long Press
Required change

Do not show delete icon directly in each transaction row by default.

Instead:

on long press of a transaction row, open a contextual action state or bottom sheet
show option:
Delete transaction
optionally Edit transaction
optionally View details
Delete behavior

When Delete is selected:

show confirmation modal before deleting
modal must include:
transaction title
amount
date
account
warning text
Confirmation actions
Cancel
Delete
After deletion
show Undo snackbar or toast
do not affect unrelated transaction records
do not break ledger totals after deletion
10. Floating Add Transaction Button

Add a floating action button at the bottom-right corner of the Ledger page.

Behavior
visible in all Ledger filter views
opens Add Transaction flow
should not block important content
should float above list safely
Design expectation
premium gradient/glow button aligned with Finly theme
strong tap affordance
same behavior as existing add transaction action elsewhere in app
11. Recurring Transactions Logic Fix

Even if upcoming recurring is removed from the Ledger page, fix the recurring logic across the UI.

Current bug

Recurring transactions with dates already passed are still shown as upcoming.

Example:

today is April 8
transaction due April 1 or April 5 should not appear under upcoming recurring
Correct behavior

Only future recurring transactions should be shown as upcoming.

Rules
If recurring date is earlier than today, do not show it as upcoming
If recurring date is today or future, show it correctly
Once recurring transaction is completed or posted, update its next occurrence properly
Avoid duplicate or outdated upcoming entries
Design expectation

If recurring section is used elsewhere, ensure the logic is date-aware and accurate.

12. Preserve Existing Functionality

This Ledger redesign must not modify or break:

existing transaction creation flow
account balances
recurring transaction engine
bookmark logic
goals/savings logic
reports calculations
existing add transaction flow
transaction details navigation
category/account mapping
any other working feature outside Ledger layout and specified Ledger interactions

This is a UI/UX simplification and behavior refinement, not a destructive redesign.

13. Interaction Rules

Apply these interaction behaviors:

single tap on transaction row → open transaction details
single tap on bookmark → toggle bookmark
long press on transaction row → open action menu with delete
delete must always require confirmation
filter switching must not reset unrelated app state
animations should be subtle and smooth
all controls must have active, pressed, and disabled states where relevant
14. Required Screens / States in Figma

Create the following Ledger-related screens and states:

Ledger page – Daily view
Ledger page – Weekly view
Ledger page – Monthly view
Ledger page – Annual view
Ledger page – Custom date range view
Long press action state on transaction
Delete confirmation modal
Empty state when no transactions
Floating add transaction button state
Bookmark active/inactive state
Savings transfer transaction state
Responsive variants for:
Android
iPhone
tablet
desktop
15. Visual Direction

Use this visual direction:

clean premium ledger design
dark-theme fintech style
minimal clutter
highly readable amounts and dates
elegant transaction grouping
subtle separators between dates/weeks/months
polished floating action button
simple, structured, data-first layout
professional, not overdecorated

The final Ledger page should feel like a real money management ledger, not a feature-heavy dashboard.

Shorter Figma AI Prompt Version

Use this shorter version if you want direct tool input:

Redesign the Finly Ledger page to be simpler and cleaner, inspired by a minimal financial ledger layout. Remove search bar, saved filters, quick add, recap, and upcoming recurring from the Ledger page. Add a compact top summary strip showing Income, Expenses, Savings, and Balance based on the selected filter. Replace existing controls with period filters: Daily, Weekly, Monthly, Annually, and Custom. In Daily view, group transactions by day with bold date, day name, month and year, plus day-level totals. Add elegant spacing or subtle dividers between date groups. Keep bookmark visible on each transaction row, but remove delete icon from default view. Delete should appear only on long press of a transaction row, followed by a confirmation modal before deletion and an Undo snackbar after delete. Add a floating Add Transaction button at the bottom-right. Ensure savings transfers are tracked separately under Savings and visually labeled when money is moved into a savings account. Also fix recurring transaction logic so only future recurring items show as upcoming across the app. Preserve all existing functionality and do not break transaction creation, balances, reports, goals, or bookmark behavior. Use a premium dark-theme fintech style with responsive layouts for Android, iPhone, tablet, and desktop.