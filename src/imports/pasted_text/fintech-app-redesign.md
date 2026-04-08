Redesign and upgrade the Finly application UI and front-end interaction design so that it is fully responsive across Android phones, iPhones, tablets, and desktop screens, while also fixing the calculator component and implementing a fully functional Goals module with real financial tracking behavior.

The output should feel like a real production fintech application, not just a static design.
All screens must include working UX logic, clear states, consistent interactions, and responsive layouts.

Use a premium dark-theme fintech style with clean typography, consistent spacing, smooth states, and scalable layouts for mobile and desktop.

1. Responsive Design Across All Devices
Objective

Make the complete Finly application responsive for:

Android phones
iPhones
small tablets
large tablets
desktop web
Responsive requirements

Create layouts that adapt correctly without breaking:

spacing
card alignment
typography scale
navigation placement
button size
bottom nav / side nav behavior
modal width and height
charts and goal cards
calculator layout
reports sections
forms and input controls
Required breakpoints

Design responsive variants for:

small mobile
standard mobile
large mobile / iPhone Pro Max
tablet
desktop
Responsive behavior rules
On mobile: use bottom navigation
On tablet: use adaptive navigation with larger content areas
On desktop: use side navigation or top navigation where appropriate
Cards must resize proportionally
Buttons must remain clearly tappable
Charts and progress bars must scale correctly
Text must never overflow or become too small
Modal sheets on mobile can become dialog/modal panels on tablet and desktop
Lists and grids must maintain visual balance on every screen size
Design expectation

The app must feel natively optimized for each device, not stretched from one mobile layout.

2. Calculator Fix
Current issue

The calculator is incomplete because arithmetic operators are missing, so calculations are not usable.

Required update

Redesign the calculator so it supports proper numeric calculations without affecting any other functionality.

Required calculator buttons

Include:

numbers 0–9
decimal
clear
backspace
equals
Add arithmetic operators

Include visible operator buttons for:

plus (+)
minus (-)
multiply (×)
divide (÷)
Required behavior
User can enter full expressions correctly
Show current expression clearly
Show calculated result clearly
Prevent UI confusion between entered value and final result
Support amount entry for transactions, transfers, and savings contribution
Equal button should finalize the calculation and pass the correct value to the relevant form
Clear button should reset everything
Backspace should remove only the last entered value/operator
Design expectation
Calculator should remain premium and compact
Operator buttons must be visually distinct from number buttons
Confirm button should remain prominent
Layout should work on mobile and desktop
Ensure safe calculation behavior without breaking amount-entry flow anywhere else
3. Goals Module Must Become Fully Functional
Current issue

The Goal page buttons and flows are not working properly.

Required update

Design the Goals feature as a fully working savings-goal management system.

The goal module should allow users to:

create goals
add savings manually
link savings from transfers
see live progress
see remaining target
see percentage completed
mark completed goals automatically
archive completed goals permanently
add new goals anytime
carry unfinished goals into the next financial year
generate goal-based yearly reports
4. Goal Creation Functionality
Add New Goal flow

When user taps Add New Goal, open a proper goal creation flow.

Goal form fields

Include:

Goal Name
Bike Down Payment
Car Down Payment
Laptop
Emergency Fund
Vacation
Goal Type
one-time
recurring savings goal
long-term goal
Target Amount
Saved So Far
Target Date
Start Date
Linked Savings Account
Category / Tag
Financial Year
Carry Forward Allowed toggle
Auto-contribution toggle optional
Notes / Description
Design expectation
Form must be simple but powerful
Clear CTAs:
Cancel
Save Goal
After save, the goal should appear in Goals list immediately
5. Transfer Money to Goal Functionality
Core business logic to represent in UI

If user has surplus money in any account and transfers part of it into a savings account for a specific goal, that amount must reflect in the Goals page automatically.

Required flow

When user creates a transfer:

choose From Account
choose To Account
enter Amount
optionally assign Goal Tag
optionally add Note

Example:

₹5,000 tagged to Car Down Payment
₹10,000 tagged to Bike Goal
₹15,000 tagged to Laptop Goal
Required behavior

If transfer is tagged to a goal:

that amount must update the matching goal progress automatically
saved amount must increase
remaining target must decrease
percentage completion must update live
goal card must reflect new numbers immediately
Example goal calculation

If target is ₹50,000 and user adds ₹10,000:

Target = ₹50,000
Saved = ₹10,000
Remaining = ₹40,000
Progress = 20%

Show this clearly on the goal card.

Design expectation

Add a clear and easy UX for:

Transfer to Savings
Tag this transfer to a goal
View goal-linked transfer history
6. Goal Card UI Must Show Real Progress

Each goal card must clearly display:

Goal name
Goal icon
Goal type
Target date
Manual or Auto contribution label
Linked account
Saved amount
Target amount
Remaining amount
Percentage completed
Progress bar
Last contribution date
Record Savings button
View Details button
Edit Goal button
Example display

For Bike Goal:

Target: ₹50,000
Saved: ₹10,000
Remaining: ₹40,000
Progress: 20%

For Car Goal:

Target: ₹5,00,000
Saved: ₹1,20,000
Remaining: ₹3,80,000
Progress: 24%
Design expectation

Progress details must be instantly understandable without opening another page.

7. Record Savings Button Must Work
Required update

When user taps Record Savings, open a contribution modal or screen.

Contribution options

Allow:

manual entry
transfer from account
choose linked goal
add note/tag
add date
choose whether it is one-time or recurring contribution
Required result

After saving:

goal updates instantly
transaction is recorded in history
linked savings account reflects movement
goal history updates
8. Completed Goal Handling
Required behavior

When a goal reaches 100%:

automatically mark it as Goal Achieved
move it to a permanent Completed Goals section or archive
retain full record of:
target amount
total saved
completion date
linked transactions
financial year in which completed
Design expectation

Completed goals should not disappear silently.
They should be stored permanently in:

Completed Goals page
Goal achievement history
yearly reports
Add options
View completed goal details
Duplicate goal
Reopen goal if needed
Celebrate completion with subtle success state or animation
9. Add More Goals Anytime
Required update

User must be able to create unlimited new goals.

Examples
Bike down payment
Car down payment
New phone
Laptop
Wedding fund
Child education
Travel fund
Emergency reserve
Design expectation

Goals section should scale gracefully when many goals exist:

list view
grouped view
active vs completed tabs
search and filter options
10. Financial Year Goal Reporting
Required update

Create a goal reporting system for each financial year.

Report should show

For a selected financial year:

number of goals created
number of goals completed
number of active goals
total target amount across all goals
total saved amount across all goals
amount achieved this financial year
carry-forward goals count
goals completed this year
goals pending next year
Include filters
financial year
account
goal type
active / completed / carry-forward
short-term / long-term
Design expectation

Make this available in Reports under a Goals section or dedicated Goal Analytics page.

11. Carry-Forward Goals Across Financial Years
Required update

If a long-term goal is not completed in one financial year, it must continue into the next year without losing its history.

Example

Car down payment goal:

Target = ₹5,00,000
Saved in FY 2026–27 = ₹1,20,000
Remaining = ₹3,80,000
Goal continues into FY 2027–28
Required behavior

Carry-forward goals must retain:

original start date
target amount
already saved amount
annual contributions history
remaining balance
progress percentage
Design expectation

Clearly show:

Carry Forward badge
Previous FY contribution
Current FY contribution
Total saved across years
12. Goal Details Page

Create a dedicated Goal Details screen with:

Goal summary
Linked savings account
Target amount
Saved amount
Remaining amount
Progress percentage
Contribution history timeline
Recurring savings plan if any
Milestone tracking
Completion estimate
Edit goal
Pause goal
Complete goal manually if needed
Archive / delete rules
13. Missing Functional Improvements to Add

Also include these missing improvements in the redesign:

A. Goal-linked transaction history

User should be able to see all transactions or transfers that contributed to a goal.

B. Savings account mapping

A goal should optionally be linked to a dedicated account or wallet.

C. Over-achievement handling

If user saves more than target:

show goal as exceeded
display extra saved amount
let user move surplus elsewhere if needed
D. Goal milestones

Optional milestone tracking:

25%
50%
75%
100%
E. Notifications

Add reminders or notifications for:

upcoming target date
monthly contribution due
goal completed
low progress warning
F. Pause / resume goal

Allow user to pause a goal temporarily without deleting it.

G. Edit target amount

User should be able to revise target amount if prices change.

H. Delete goal safety

Deleting a goal should require confirmation and should clarify whether transactions remain or unlink.

14. Interaction Rules

Apply these interaction rules everywhere:

every tappable element must have visible tap feedback
every button must have active, pressed, disabled, and success states
no decorative buttons without functionality
cards should clearly communicate status
empty states must be handled properly
loading states and skeleton states should be included
success snackbars should appear after save/update/delete
error states must be shown clearly
all buttons on Goals page must work in prototype logic
15. Figma Deliverables

Create responsive, production-ready screens and clickable prototypes for:

Responsive layouts
Android mobile
iPhone mobile
tablet
desktop
Core screens
Goals overview page
Add New Goal flow
Goal details page
Record Savings modal
Transfer to Goal flow
Completed Goals archive
Goal yearly analytics page
Carry-forward goal state
Calculator with arithmetic operators
Responsive transaction / transfer entry screens
State variants
active
completed
carried forward
archived
no goals
partially achieved
fully achieved
exceeded target
16. Visual Direction

Use a premium fintech design style:

dark-first theme
smooth gradients
subtle glow on key actions
readable typography
clear progress indicators
elegant cards
professional icons
clean charts
responsive layouts with balanced spacing

The redesign should make Goals feel like a real financial planning feature, not just a visual card list.

Shorter Figma AI prompt version

If you want a shorter version for direct Figma AI input, use this:

Redesign Finly to be fully responsive across Android, iPhone, tablet, and desktop. Fix the calculator by adding arithmetic operators (+, -, ×, ÷), clear expression/result display, and proper amount-entry behavior without breaking existing flows. Make the Goals module fully functional: users must be able to create goals, link transfers from any account to a goal-tagged savings account, automatically update saved amount, remaining target, and percentage progress, record manual savings, view contribution history, mark goals as achieved automatically at 100%, archive completed goals permanently, add unlimited goals, carry unfinished goals across financial years, and view yearly goal reports showing goals created, completed, active, carried forward, total target, and total saved. Add Goal Details, Completed Goals, Record Savings, Transfer to Goal, and Goal Analytics screens. Ensure all buttons, cards, toggles, filters, and actions are interactive with clear states. Use a premium dark-theme fintech design with clean typography, scalable responsive layouts, elegant progress bars, professional icons, and production-ready UX.

Two important functionality gaps you should also include

You were already thinking correctly. These are the extra things I strongly recommend adding:

goal contribution history
so user can see exactly when ₹5,000 or ₹10,000 was added and from which account
goal-account reconciliation
so goal progress and savings-account balance never feel disconnected