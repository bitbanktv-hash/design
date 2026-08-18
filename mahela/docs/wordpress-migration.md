# MahELA → WordPress migration plan

This turns the mapping sketched in `README.txt` into an actionable build
plan: the exact roles/capabilities, CPT/meta schema, the AJAX/REST contract
`assets/js/app.js` will need once it's talking to a real backend, and a
phased rollout order. Nothing here is implemented yet — this prototype stays
static HTML — but every screen is built with this mapping in mind so the
backend swap doesn't force a redesign.

---

## 1. Roles & capabilities

Three roles, matching the three login tabs:

| MahELA role | WordPress role | Base capabilities |
|---|---|---|
| Admin | `administrator` (built-in) | Everything |
| Teacher | custom `mahela_teacher` | `read`, `mahela_manage_own_students` |
| Student | custom `mahela_student` | `read` (view-own-profile only, enforced in template/REST, not a WP capability) |

Per-teacher access is **reduced from a full set**, not built up — matches
`admin-teachers.html`'s Permissions panel, where every teacher starts with
everything on and an admin toggles individual capabilities off:

```php
function mahela_register_roles() {
    add_role( 'mahela_teacher', 'Teacher', array(
        'read'                        => true,
        'mahela_manage_students'      => true,
        'mahela_manage_schedule'      => true,
        'mahela_manage_finance'       => true,
        'mahela_manage_skills'        => true,
        'mahela_send_messages'        => true,
    ) );
    add_role( 'mahela_student', 'Student', array( 'read' => true ) );
}
register_activation_hook( __FILE__, 'mahela_register_roles' );
```

Toggling a switch in `admin-teachers.html`'s Permissions modal maps 1:1 to:

```php
$user->remove_cap( 'mahela_manage_finance' ); // or add_cap() to restore
```

The Active/Restricted status badge (`admin-teachers.html`) is **computed**,
never stored directly — same as the prototype's client-side logic: a
teacher is "Restricted" if any of the five capabilities is off, "Active" if
all five are on, "Suspended" is a separate explicit state (see §4).

No public registration anywhere — enforce this server-side, not just by
omitting a signup page:

```php
add_filter( 'option_users_can_register', '__return_false' );
add_filter( 'registration_errors', function ( $errors ) {
    $errors->add( 'not_allowed', __( 'Registration is disabled. Ask your school admin to create an account for you.' ) );
    return $errors;
} );
```

---

## 2. Data model (CPTs + meta)

### `mahela_student` (CPT)

| Field | Storage | Notes |
|---|---|---|
| Name | post title | |
| Owning teacher | `teacher_id` meta (WP user ID) | **The** row-level security boundary — every teacher-side query filters on this |
| Linked login | `student_user_id` meta (WP user ID) | The student's own `mahela_student`-role account |
| Gender | `gender` meta (`female`/`male`) | Drives `data-gender` accent in the UI — keep the same two values |
| Level (A1–C2) | `level` meta | |
| Avatar | featured image | |
| Phone | `phone` meta | |

```php
register_post_type( 'mahela_student', array(
    'public'              => false,
    'show_ui'             => true,
    'capability_type'     => array( 'mahela_student', 'mahela_students' ),
    'map_meta_cap'        => true,
    'supports'            => array( 'title', 'thumbnail' ),
) );
```

Every teacher-facing query MUST filter by ownership — this is the whole
multi-tenant guarantee the README promises ("Teacher A can never see
Teacher B's students"):

```php
function mahela_get_students_for_teacher( $teacher_id ) {
    return get_posts( array(
        'post_type'  => 'mahela_student',
        'meta_key'   => 'teacher_id',
        'meta_value' => $teacher_id,
        'numberposts' => -1,
    ) );
}
```
`admin-students.html` is the one screen that intentionally bypasses this
filter (admin sees every student, across every teacher) — gate that view on
`current_user_can( 'administrator' )`, not on omitting the filter by
mistake elsewhere.

### `mahela_session` (CPT) — Schedule tab

One post per class. Meta: `student_id`, `teacher_id`, `datetime`,
`duration_minutes`, `status` (`scheduled`/`completed`/`cancelled`).

### Skill assessments — post meta with history, not a CPT

`student-detail.html`'s radar chart needs a **time series**, not just a
current value — store as a serialized array on the student post so
"New Assessment" always appends rather than overwrites:

```php
$history = get_post_meta( $student_id, 'skill_history', true ) ?: array();
$history[] = array(
    'date'      => current_time( 'mysql' ),
    'listening' => 4, 'speaking' => 3, 'reading' => 5, 'writing' => 3,
);
update_post_meta( $student_id, 'skill_history', $history );
```
The radar chart renders the latest entry; a future "progress over time"
view (not in this prototype) would use the full array.

### Finance / settlement

Computed, not stored as a running balance — same pattern as the
Active/Restricted badge: `unsettled = (completed sessions since
last-settled-date) × price_per_session`. Store only:
- `price_per_session` (meta on student)
- `settled_until` (meta on student, a date — updated when a teacher marks
  a settlement)

Never store "current balance" as a mutable number; always derive it from
session records + `settled_until`, or the settlement UI and the session log
will drift apart.

### Messages

A custom table beats a CPT here (high write volume, no need for WP's post
revision/meta machinery):

```sql
CREATE TABLE {$wpdb->prefix}mahela_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    sender_user_id BIGINT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    KEY student_id (student_id)
);
```

---

## 3. AJAX/REST contract

Everything in `app.js`/inline page scripts is client-only right now (forms
show a toast and discard the data). Each of these becomes a REST route
under `mahela/v1`, authenticated via the standard WP REST nonce
(`wp_localize_script`'d into every page alongside the existing i18n dict):

| Prototype action | Route | Method | Capability required |
|---|---|---|---|
| Add Student (teacher-dashboard.html) | `/students` | `POST` | `mahela_manage_students` |
| Edit Details (student-detail.html) | `/students/{id}` | `PATCH` | `mahela_manage_students` + ownership check |
| New Assessment | `/students/{id}/skills` | `POST` | `mahela_manage_skills` + ownership |
| Add Session | `/students/{id}/sessions` | `POST` | `mahela_manage_schedule` + ownership |
| Send message | `/students/{id}/messages` | `POST` | `mahela_send_messages` + ownership |
| Create Teacher (admin-teachers.html) | `/teachers` | `POST` | `administrator` |
| Toggle permission | `/teachers/{id}/permissions` | `PATCH` | `administrator` |
| Reset password (admin-initiated) | `/teachers/{id}/reset-password` or `/students/{id}/reset-password` | `POST` | `administrator` |
| Settings save | `/me` | `PATCH` | any logged-in role, self only |
| Forgot password | `/auth/forgot-password` | `POST` | public, rate-limited |

Every ownership-checked route re-validates server-side that
`get_post_meta( $student_id, 'teacher_id', true ) === get_current_user_id()`
— the client never gets to assert whose student it's editing.

---

## 4. Security — the two features that need a real backend

Both are called out in `README.txt` as intentionally faked in the
prototype; this is the concrete implementation plan.

**CAPTCHA-after-3-failed-attempts.** Currently a JS variable that resets on
reload. Real version:
- `wp_login_failed` hook increments a per-user (or per-IP, for unknown
  emails) counter in a transient: `set_transient( "mahela_fail_{$key}", $count, 15 * MINUTE_IN_SECONDS )`.
- At 3+, the login route requires a verified CAPTCHA token before
  attempting `wp_signon()` — use Cloudflare Turnstile or hCaptcha,
  verified server-side via their siteverify endpoint before the password
  check ever runs.
- Reuse the exact client-side challenge UI already built (`login.html`'s
  math-challenge widget) as the CAPTCHA's *visual* fallback if the chosen
  service supports a custom challenge, or swap in the vendor's widget —
  either way the trigger-at-3 UX stays identical.

**Password reset.** Currently `forgot-password.html` always shows the same
"if that email exists, we sent a link" message with no real email — that
wording is correct and should be kept as-is (don't leak whether an email is
registered). Real version: `wp_mail()` with a signed, single-use, expiring
token (`wp_generate_password( 20, false )` stored as a transient keyed to
the user ID, 1-hour TTL), consumed by a reset-confirmation page that isn't
in this prototype yet and will need its own screen.

Both suspend/reset actions in `admin-teachers.html` (Suspend, admin-
initiated password reset) map to standard WP primitives:
`wp_set_password()` for the latter, and a custom `is_suspended` user meta
(checked in `wp_authenticate` to block login) for the former — WordPress
has no built-in "suspended" state.

---

## 5. Screen → WordPress piece (quick reference)

| Screen | Becomes |
|---|---|
| `login.html` | Custom login template, 3-tab UI kept as-is, posts to `wp_signon()` |
| `forgot-password.html` | Custom template → `/auth/forgot-password` |
| `teacher-dashboard.html` | Teacher-role dashboard template, students filtered by `teacher_id` |
| `student-detail.html` | Single `mahela_student` template, tabs unchanged |
| `student-panel.html` | Student-role dashboard, `student_user_id` → own record only |
| `settings.html` | Wraps the standard WP profile screen + custom meta fields (gender, phone) |
| `admin-dashboard.html` | Admin-only template, site-wide aggregate queries |
| `admin-teachers.html` | Admin-only, WP_User_Query filtered to `mahela_teacher` role |
| `admin-students.html` | Admin-only, unfiltered `mahela_student` query (the one screen without the `teacher_id` filter) |

---

## 6. What carries over unchanged

No rewrite needed for:
- `assets/css/*.css` — token system, logical properties, dark mode, RTL
  rules all work identically once served from a WP theme
- `assets/js/clock.js`, `radar-chart.js`, `theme.js` — pure client logic,
  zero backend dependency
- `assets/js/i18n.js` — keep as the custom dictionary-based system rather
  than migrating to WPML/Polylang; it's simpler than this app needs a
  plugin for, and every string is already keyed
- The modal/tabs ARIA wiring in `app.js` (`initModals`/`initTabs`) — pure
  DOM behavior, works against server-rendered markup exactly as it does
  against the static HTML now

Everything that *does* need backend wiring is exactly the "Mocked" list in
`README.txt`: form submissions, login, and the three tabs (Schedule /
Finance / Messages) that are currently shared/generic data instead of
per-student.

---

## 7. Suggested rollout order

1. Roles/capabilities + `mahela_student` CPT + teacher-ownership query
   filter — nothing else works without this foundation.
2. Real login (`wp_signon()`) + Settings save — smallest slice that
   replaces a "mocked" flag with working auth.
3. Add Student / Edit Details / New Assessment — the teacher's core loop.
4. Admin panel (teachers CRUD, permissions, admin-students view).
5. Schedule + Finance (needs `mahela_session` CPT and the settlement
   calculation).
6. Messages (custom table + polling or REST-based send).
7. CAPTCHA + real password reset — do this **before** any production
   traffic, even though it's ordered last for build convenience; don't
   ship real accounts without it.
