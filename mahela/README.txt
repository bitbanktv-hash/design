MahELA — Static Prototype
============================

How to view
------------
No server, no install needed. Just open index.html directly in any
browser (double-click it). Every page links to the next one, so you can
click through the whole flow:

  index.html               Landing page
  → login.html              Teacher / Student / Admin login (3 role tabs)
  → forgot-password.html      Password reset via email (mocked)
  → teacher-dashboard.html    Teacher's student list
  → student-detail.html?student=<key>   Teacher's view of one student (5 tabs)
  → student-panel.html        Student's own view (their own 4 tabs)
  → settings.html?role=teacher|student|admin  Profile: photo, details, password
  → admin-dashboard.html      Admin: system-wide overview
  → admin-teachers.html        Admin: teacher accounts, permissions, password reset
  → admin-students.html        Admin: every student, across every teacher

There's no self-registration -- an admin creates teacher accounts, and
teachers create student accounts, so "signup" was removed entirely. Log
in with the Admin tab to reach the admin panel directly.

Try these to get a feel for the motion design:
  - Toggle the sun/moon icon (top right) for dark mode
  - Toggle FA/EN for the language switch (also flips the layout to RTL,
    and switches the clock to show only the Shamsi date)
  - On the dashboard, click different student cards -- each now opens
    its own real data (name, level, skills), not always the same one
  - On login.html, submit the form 3 times to see the CAPTCHA appear,
    then solve it to get through
  - On admin-teachers.html, click the shield icon on any teacher row to
    open their Permissions panel and toggle something off -- watch their
    status badge change to "Restricted"
  - On student-detail.html, click the "Skills" tab to watch the radar
    chart draw itself in
  - Type a message in the "Messages" tab and hit Send
  - Open "+ Add Student" or "+ New Assessment" to see the modals
  - On settings.html, upload a photo to see the live preview


About the color correction
-----------------------------
#1404f isn't valid hex (needs 3 or 6 digits). I used #14044F — a deep
indigo — as the dark anchor color for text and dark mode. If you meant a
different color, tell me the correct 6-digit code and I'll swap it
everywhere in one pass (it's a single CSS variable, --c-ink, at the top
of assets/css/base.css).


What's real vs. mocked in this prototype
--------------------------------------------
Real, working, no shortcuts:
  - The digital clock (updates every second)
  - The Gregorian → Jalali date conversion (hand-built and verified
    against known reference dates, e.g. Nowruz) -- Persian mode shows
    only the Shamsi date, English mode shows both
  - The radar chart (genuine SVG math, not an image)
  - Dark/light theme and language switching (persists via localStorage)
  - Per-student dynamic rendering on the dashboard: each card links to
    student-detail.html?student=<key>, and the page reads that to show
    the right name/avatar/gender/level/skills
  - Live thousand-separator formatting on price input fields as you type
  - Photo upload preview on the Settings page (FileReader, client-side
    only -- nothing is actually uploaded anywhere)
  - Email and mobile-number format validation on every account form
    (inline error messages, shared across the whole prototype)
  - The CAPTCHA-after-3-failed-attempts flow (see security note below)
  - Admin permissions: toggling a teacher's access in admin-teachers.html
    genuinely recalculates their Active/Restricted status
  - Tab switching, modals, mobile sidebar, search filtering

Mocked (since there's no backend yet):
  - Login just navigates to the next page — no real accounts or auth.
    To actually demonstrate the CAPTCHA flow without a backend to check
    real credentials against, the first 3 submits on each login tab are
    treated as "wrong password" on purpose -- this is intentional, not
    a bug, so you can see the exact intended flow.
  - "Add Student", "Create Teacher", "New Assessment", "Add Session",
    "Save Details", password resets/updates -- all show a confirmation
    toast but don't persist data anywhere or actually change anything
  - "Send Reset Link" on forgot-password.html can't really email anyone
  - Schedule, Finance, and Messages content is shared/generic across
    students (only identity + skills are genuinely per-student so far)
  - Sending a chat message appends it visually but nothing is saved
  - admin-students.html shows the 5 students that have real profile
    data behind them; the dashboard's "27 total students" KPI is
    illustrative of what a real, larger roster would show


A note on the security features
------------------------------------
CAPTCHA and password-reset-by-email are the two features here that
fundamentally CANNOT be made "real" without a backend -- there's no
server to verify a CAPTCHA response against or to send an email from.
What you're seeing is a faithful UX simulation of the intended flow, so
it's ready to review and approve before the real (server-side) version
gets built. When this becomes WordPress: CAPTCHA moves to a real service
(hCaptcha, Cloudflare Turnstile, or Google reCAPTCHA) verified server-
side, failed-attempt counts get stored per-user (not just in a JS
variable that resets on reload), and password reset uses wp_mail() with
a signed, expiring token.


What happens when we convert this to WordPress
---------------------------------------------------
Every screen here maps to a real WordPress piece:
  - Super Admin              → a WordPress user with the "administrator" role
  - Teacher accounts        → WordPress users with a custom "Teacher" role,
                               created by an admin (no public registration)
  - Teacher permissions      → WordPress capabilities, added/removed per-user
                               via the same toggle UI you see in admin-teachers.html
  - Student profiles        → a Custom Post Type, owned by (assigned to) a teacher,
                               with a linked WordPress user for their login
  - Skill assessments        → post meta with a timestamped history
  - Schedule                 → a "Session" CPT or structured meta, one row per class
  - Finance/settlement       → computed from session records + a stored
                               "settled until" date per student
  - Messages                 → a custom table or CPT, saved via AJAX,
                               with the same two-way thread you see here
  - Settings/profile         → the standard WordPress profile screen
                               (avatar, password) plus custom fields for gender/phone
  - CAPTCHA                  → a real CAPTCHA service, verified server-side,
                               triggered by a real failed-login counter per user
  - Password reset            → wp_mail() with a signed, expiring reset token
  - Clock/date, radar chart, theme/language toggle → carry over as-is,
    since they're already plain JS/CSS with no backend dependency


Multi-teacher data model (for when we build the real thing)
-----------------------------------------------------------------
Each teacher only ever sees their own students. In WordPress terms: the
Student CPT will store a "teacher_id" meta field, and every query on the
teacher side will filter by "only students belonging to me" — so Teacher
A can never see Teacher B's students, schedules, or messages.
