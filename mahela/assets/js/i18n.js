/**
 * MahtELA i18n.
 * Default language is English. Every translatable element carries
 * data-i18n="key" (textContent) or data-i18n-ph="key" (placeholder).
 * Language choice persists in localStorage and flips <html lang/dir>.
 */
( function () {
	'use strict';

	var DICT = {
		// Shared / nav
		brand_name: { en: 'MahELA', fa: 'مه‌ای‌ال‌ای' },
		brand_tagline: { en: 'Mahta English Learning Academy', fa: 'آکادمی یادگیری انگلیسی مهتا' },
		nav_dashboard: { en: 'Dashboard', fa: 'داشبورد' },
		nav_students: { en: 'Students', fa: 'شاگردان' },
		nav_schedule: { en: 'Schedule', fa: 'زمان‌بندی' },
		nav_messages: { en: 'Messages', fa: 'پیام‌ها' },
		nav_settings: { en: 'Settings', fa: 'تنظیمات' },
		nav_logout: { en: 'Log Out', fa: 'خروج' },
		nav_back_dashboard: { en: 'Back to Dashboard', fa: 'بازگشت به داشبورد' },

		// Landing page
		landing_welcome: { en: 'Welcome! Track your progress, see your schedule, and stay in touch with your teacher — all in one place.', fa: 'خوش اومدی! پیشرفتت رو ببین، برنامه‌ی کلاست رو چک کن، و با معلمت در ارتباط باش — همه‌جا یه‌جا.' },
		landing_cta: { en: 'Enter Panel', fa: 'ورود به پنل' },
		footer_credit: { en: 'Designed by Acc Manager', fa: 'طراحی‌شده توسط Acc Manager' },

		// Auth
		auth_role_teacher: { en: 'Teacher', fa: 'معلم' },
		auth_role_student: { en: 'Student', fa: 'شاگرد' },
		auth_login_title: { en: 'Welcome back', fa: 'خوش برگشتی' },
		auth_login_sub: { en: 'Log in to continue to your panel', fa: 'برای ادامه وارد پنلت شو' },
		auth_email: { en: 'Email', fa: 'ایمیل' },
		auth_password: { en: 'Password', fa: 'رمز عبور' },
		auth_remember: { en: 'Remember me', fa: 'من رو به‌خاطر بسپار' },
		auth_forgot: { en: 'Forgot password?', fa: 'رمز رو فراموش کردی؟' },
		auth_login_btn: { en: 'Log In', fa: 'ورود' },
		auth_teacher_note: { en: "Don't have an account? Ask your school admin to create one for you.", fa: 'اکانت نداری؟ از مدیر مدرسه‌ت بخواه برات بسازه.' },
		auth_student_note: { en: 'Students get an invite link from their teacher — no self sign-up.', fa: 'شاگردها لینک دعوت رو از معلمشون می‌گیرن — نیازی به ثبت‌نام مستقل نیست.' },

		// Settings / profile
		settings_title: { en: 'Settings', fa: 'تنظیمات' },
		settings_sub: { en: 'Manage your photo, personal details, and password.', fa: 'عکس، اطلاعات شخصی و رمز عبورت رو مدیریت کن.' },
		settings_photo_title: { en: 'Profile Photo', fa: 'عکس پروفایل' },
		settings_upload_photo: { en: 'Upload Photo', fa: 'آپلود عکس' },
		settings_remove_photo: { en: 'Remove', fa: 'حذف' },
		settings_details_title: { en: 'Personal Details', fa: 'اطلاعات شخصی' },
		settings_full_name: { en: 'Full Name', fa: 'نام و نام‌خانوادگی' },
		settings_email: { en: 'Email', fa: 'ایمیل' },
		settings_gender: { en: 'Gender', fa: 'جنسیت' },
		settings_save_details: { en: 'Save Details', fa: 'ذخیره‌ی اطلاعات' },
		settings_password_title: { en: 'Change Password', fa: 'تغییر رمز عبور' },
		settings_current_password: { en: 'Current Password', fa: 'رمز عبور فعلی' },
		settings_new_password: { en: 'New Password', fa: 'رمز عبور جدید' },
		settings_confirm_password: { en: 'Confirm New Password', fa: 'تکرار رمز عبور جدید' },
		settings_save_password: { en: 'Update Password', fa: 'به‌روزرسانی رمز عبور' },
		settings_password_mismatch: { en: "New passwords don't match.", fa: 'رمزهای جدید با هم مطابقت ندارن.' },
		settings_phone: { en: 'Mobile Number', fa: 'شماره موبایل' },

		// Validation
		validate_email_error: { en: 'Enter a valid email address.', fa: 'یه ایمیل معتبر وارد کن.' },
		validate_phone_error: { en: 'Enter a valid mobile number.', fa: 'یه شماره موبایل معتبر وارد کن.' },
		validate_required: { en: 'This field is required.', fa: 'پر کردن این فیلد الزامیه.' },

		// Admin role + CAPTCHA + forgot password
		auth_role_admin: { en: 'Admin', fa: 'ادمین' },
		auth_forgot_link: { en: 'Reset it', fa: 'بازیابیش کن' },
		captcha_title: { en: "Let's confirm you're not a robot", fa: 'بیا مطمئن شیم ربات نیستی' },
		captcha_instruction: { en: 'Too many failed attempts. Solve this to continue:', fa: 'تلاش‌های ناموفق زیاد بود. برای ادامه این رو حل کن:' },
		captcha_wrong: { en: "That's not right, try again.", fa: 'درست نیست، دوباره امتحان کن.' },
		login_failed: { en: 'Incorrect email or password.', fa: 'ایمیل یا رمز عبور اشتباهه.' },

		forgot_title: { en: 'Reset your password', fa: 'رمز عبورت رو بازیابی کن' },
		forgot_sub: { en: "Enter your account email and we'll send you a reset link.", fa: 'ایمیل حسابت رو وارد کن تا لینک بازیابی برات بفرستیم.' },
		forgot_send_btn: { en: 'Send Reset Link', fa: 'ارسال لینک بازیابی' },
		forgot_back_login: { en: 'Back to login', fa: 'بازگشت به صفحه‌ی ورود' },
		forgot_confirmation: { en: "If an account exists for that email, we've sent a reset link.", fa: 'اگه حسابی با این ایمیل وجود داشته باشه، لینک بازیابی براش ارسال شد.' },

		// Admin: shared
		admin_panel_title: { en: 'Admin Panel', fa: 'پنل مدیریت' },
		nav_admin_dashboard: { en: 'Dashboard', fa: 'داشبورد' },
		nav_admin_teachers: { en: 'Teachers', fa: 'معلم‌ها' },
		nav_admin_students: { en: 'Students', fa: 'شاگردان' },
		admin_super_admin: { en: 'Super Admin', fa: 'سوپر ادمین' },
		col_name: { en: 'Name', fa: 'نام' },
		col_email: { en: 'Email', fa: 'ایمیل' },
		col_phone: { en: 'Phone', fa: 'موبایل' },
		col_status: { en: 'Status', fa: 'وضعیت' },
		col_actions: { en: 'Actions', fa: 'عملیات' },
		status_active: { en: 'Active', fa: 'فعال' },
		status_restricted: { en: 'Restricted', fa: 'محدودشده' },
		status_suspended: { en: 'Suspended', fa: 'معلق' },
		action_edit: { en: 'Edit', fa: 'ویرایش' },
		action_reset_password: { en: 'Reset Password', fa: 'بازنشانی رمز' },
		action_permissions: { en: 'Permissions', fa: 'دسترسی‌ها' },
		action_suspend: { en: 'Suspend', fa: 'تعلیق' },
		action_reactivate: { en: 'Reactivate', fa: 'فعال‌سازی مجدد' },
		action_view_profile: { en: 'View Profile', fa: 'مشاهده‌ی پروفایل' },

		// Admin dashboard
		admin_dash_title: { en: 'Overview', fa: 'نمای کلی' },
		admin_dash_sub: { en: "Everything happening across the system, all in one place.", fa: 'هر اتفاقی که توی کل سیستم می‌افته، همه‌جا یه‌جا.' },
		kpi_total_teachers: { en: 'Total Teachers', fa: 'مجموع معلم‌ها' },
		kpi_total_students: { en: 'Total Students', fa: 'مجموع شاگردان' },
		kpi_sessions_month: { en: 'Sessions This Month', fa: 'جلسات این ماه' },
		kpi_revenue_month: { en: 'Revenue This Month', fa: 'درآمد این ماه' },
		admin_quick_links: { en: 'Quick Links', fa: 'دسترسی سریع' },
		admin_manage_teachers_desc: { en: 'Create teacher accounts, adjust permissions, reset passwords.', fa: 'ساخت اکانت معلم، تنظیم دسترسی‌ها، بازنشانی رمز عبور.' },
		admin_manage_students_desc: { en: 'See every student across every teacher.', fa: 'دیدن همه‌ی شاگردها، از همه‌ی معلم‌ها.' },

		// Admin: Teachers page
		admin_teachers_title: { en: 'Teachers', fa: 'معلم‌ها' },
		admin_teachers_sub: { en: 'Every teacher account on the platform.', fa: 'همه‌ی اکانت‌های معلم توی پلتفرم.' },
		admin_add_teacher: { en: '+ Create Teacher', fa: '+ ساخت معلم جدید' },
		col_students_count: { en: 'Students', fa: 'شاگردان' },
		modal_create_teacher_title: { en: 'Create a Teacher Account', fa: 'ساخت اکانت معلم' },
		field_temp_password: { en: 'Temporary Password', fa: 'رمز عبور موقت' },
		field_temp_password_hint: { en: "They'll be asked to change this on first login.", fa: 'اولین بار که وارد شن، ازشون خواسته می‌شه عوضش کنن.' },

		// Admin: permissions modal
		modal_permissions_title: { en: 'Teacher Permissions', fa: 'دسترسی‌های معلم' },
		modal_permissions_sub: { en: 'Turn off anything this teacher shouldn\'t be able to do.', fa: 'هر کاری که این معلم نباید بتونه انجام بده رو خاموش کن.' },
		perm_manage_students: { en: 'Manage Students', fa: 'مدیریت شاگردان' },
		perm_manage_students_desc: { en: 'Add, edit, or remove student profiles.', fa: 'افزودن، ویرایش یا حذف پروفایل شاگردان.' },
		perm_manage_schedule: { en: 'Manage Schedule', fa: 'مدیریت زمان‌بندی' },
		perm_manage_schedule_desc: { en: 'Add sessions and mark them as held.', fa: 'افزودن جلسات و ثبت برگزاری آن‌ها.' },
		perm_manage_finance: { en: 'Manage Finance', fa: 'مدیریت مالی' },
		perm_manage_finance_desc: { en: 'Set rates and settle payments.', fa: 'تعیین نرخ‌ها و تسویه‌ی پرداخت‌ها.' },
		perm_manage_skills: { en: 'Record Skill Assessments', fa: 'ثبت ارزیابی مهارت‌ها' },
		perm_manage_skills_desc: { en: 'Update the radar chart scores.', fa: 'به‌روزرسانی نمرات چارت راداری.' },
		perm_send_messages: { en: 'Send Messages', fa: 'ارسال پیام' },
		perm_send_messages_desc: { en: 'Message students directly.', fa: 'ارسال پیام مستقیم به شاگردان.' },
		btn_save_permissions: { en: 'Save Permissions', fa: 'ذخیره‌ی دسترسی‌ها' },

		// Admin: reset password modal
		modal_reset_password_title: { en: 'Reset Password', fa: 'بازنشانی رمز عبور' },
		modal_reset_password_sub: { en: 'Set a new password for this account.', fa: 'یه رمز جدید برای این اکانت تعیین کن.' },
		field_new_password_admin: { en: 'New Password', fa: 'رمز عبور جدید' },

		// Admin: Students page
		admin_students_title: { en: 'Students', fa: 'شاگردان' },
		admin_students_sub: { en: 'Every student across every teacher.', fa: 'همه‌ی شاگردان، از همه‌ی معلم‌ها.' },
		col_teacher: { en: 'Teacher', fa: 'معلم' },
		col_level: { en: 'Level', fa: 'مرحله' },

		// Teacher dashboard
		dash_title: { en: 'Your Students', fa: 'شاگردهای تو' },
		dash_sub: { en: "Here's everyone you're currently teaching.", fa: 'این‌ها همه‌ی کسایی هستن که الان بهشون درس می‌دی.' },
		dash_search_ph: { en: 'Search students…', fa: 'جست‌وجوی شاگرد…' },
		dash_add_student: { en: '+ Add Student', fa: '+ افزودن شاگرد' },
		dash_stat_students: { en: 'Active Students', fa: 'شاگردهای فعال' },
		dash_stat_sessions_week: { en: 'Sessions This Week', fa: 'جلسات این هفته' },
		dash_stat_unsettled: { en: 'Unsettled Balance', fa: 'مانده‌ی تسویه‌نشده' },
		dash_next_class: { en: 'Next class', fa: 'کلاس بعدی' },
		dash_no_upcoming: { en: 'No upcoming class scheduled', fa: 'کلاس آینده‌ای برنامه‌ریزی نشده' },
		dash_view_profile: { en: 'View Profile', fa: 'مشاهده‌ی پروفایل' },

		// Add student modal
		modal_add_student_title: { en: 'Add a New Student', fa: 'افزودن شاگرد جدید' },
		field_student_name: { en: "Student's full name", fa: 'نام و نام‌خانوادگی شاگرد' },
		field_student_email: { en: 'Email (for their login)', fa: 'ایمیل (برای ورودشون)' },
		field_level: { en: 'Current Level', fa: 'مرحله‌ی فعلی' },
		field_gender: { en: 'Gender', fa: 'جنسیت' },
		gender_female: { en: 'Female', fa: 'دختر' },
		gender_male: { en: 'Male', fa: 'پسر' },
		account_gender_female: { en: 'Female', fa: 'زن' },
		account_gender_male: { en: 'Male', fa: 'مرد' },
		field_session_duration: { en: 'Session Duration (minutes)', fa: 'مدت هر جلسه (دقیقه)' },
		field_session_price: { en: 'Price per Session (Toman)', fa: 'هزینه‌ی هر جلسه (تومان)' },
		btn_save: { en: 'Save', fa: 'ذخیره' },
		btn_cancel: { en: 'Cancel', fa: 'انصراف' },

		// Student detail tabs
		tab_overview: { en: 'Overview', fa: 'مرور کلی' },
		tab_skills: { en: 'Skills', fa: 'مهارت‌ها' },
		tab_schedule: { en: 'Schedule', fa: 'زمان‌بندی' },
		tab_finance: { en: 'Finance', fa: 'مالی' },
		tab_messages: { en: 'Messages', fa: 'پیام‌ها' },

		// Overview
		overview_level: { en: 'Current Level', fa: 'مرحله‌ی فعلی' },
		overview_rate: { en: 'Rate', fa: 'نرخ' },
		overview_per_session: { en: '/ session', fa: '/ جلسه' },
		overview_duration: { en: 'Duration', fa: 'مدت' },
		overview_minutes: { en: 'min', fa: 'دقیقه' },
		overview_started: { en: 'Student since', fa: 'شاگرد از تاریخ' },
		overview_edit: { en: 'Edit Details', fa: 'ویرایش اطلاعات' },

		// Skills / radar
		skills_title: { en: 'Skill Mastery', fa: 'میزان تسلط بر مهارت‌ها' },
		skills_sub: { en: "Rate each skill from 0 to 100 — update it any time you see progress.", fa: 'هر مهارت رو از ۰ تا ۱۰۰ نمره بده — هروقت پیشرفتی دیدی، به‌روزش کن.' },
		skills_new_assessment: { en: '+ New Assessment', fa: '+ ثبت ارزیابی جدید' },
		skills_history: { en: 'Assessment History', fa: 'تاریخچه‌ی ارزیابی‌ها' },
		skills_listening: { en: 'Listening', fa: 'شنیداری' },
		skills_speaking: { en: 'Speaking', fa: 'گفتاری' },
		skills_reading: { en: 'Reading', fa: 'خوانداری' },
		skills_writing: { en: 'Writing', fa: 'نوشتاری' },

		// Schedule
		schedule_title: { en: 'Class Schedule', fa: 'برنامه‌ی کلاس‌ها' },
		schedule_sub: { en: 'Every session, past and upcoming.', fa: 'همه‌ی جلسات، گذشته و آینده.' },
		schedule_add: { en: '+ Add Session', fa: '+ افزودن جلسه' },
		schedule_upcoming: { en: 'Upcoming', fa: 'پیش‌رو' },
		schedule_past: { en: 'Past Sessions', fa: 'جلسات گذشته' },
		schedule_held: { en: 'Held', fa: 'برگزار شد' },
		schedule_mark_held: { en: 'Mark as Held', fa: 'ثبت به‌عنوان برگزارشده' },
		schedule_missed: { en: 'Missed', fa: 'برگزار نشد' },
		schedule_scheduled: { en: 'Scheduled', fa: 'برنامه‌ریزی‌شده' },

		// Finance
		finance_title: { en: 'Finance & Settlement', fa: 'مالی و تسویه‌حساب' },
		finance_sub: { en: 'Track sessions and settle up whenever you\'re ready.', fa: 'جلسات رو دنبال کن و هروقت آماده بودی تسویه کن.' },
		finance_settled_until: { en: 'Settled until', fa: 'تسویه‌شده تا' },
		finance_sessions_since: { en: 'Sessions since settlement', fa: 'جلسات از تسویه‌ی آخر' },
		finance_amount_due: { en: 'Amount due', fa: 'مبلغ قابل‌پرداخت' },
		finance_request_settlement: { en: 'Request Settlement', fa: 'درخواست تسویه' },
		finance_mark_settled: { en: 'Mark as Settled Today', fa: 'ثبت تسویه تا امروز' },
		finance_history: { en: 'Settlement History', fa: 'تاریخچه‌ی تسویه‌ها' },
		finance_unsettled_title: { en: 'Unsettled Sessions', fa: 'جلسات تسویه‌نشده' },
		finance_select_all: { en: 'Select All', fa: 'انتخاب همه' },
		finance_selected_label: { en: 'Selected', fa: 'انتخاب‌شده' },
		finance_sessions_word: { en: 'sessions', fa: 'جلسه' },
		finance_settle_selected: { en: 'Settle Selected', fa: 'تسویه‌ی موارد انتخابی' },

		// Messages
		messages_title: { en: 'Messages', fa: 'پیام‌ها' },
		messages_placeholder: { en: 'Type a message…', fa: 'پیامت رو بنویس…' },
		messages_send: { en: 'Send', fa: 'ارسال' },

		// Student panel (own view)
		student_panel_title: { en: 'My Panel', fa: 'پنل من' },
		student_panel_welcome: { en: 'Welcome back', fa: 'خوش برگشتی' },
		student_my_teacher: { en: 'Teacher', fa: 'معلم' },
		student_my_skills: { en: 'My Skills', fa: 'مهارت‌های من' },
		student_my_schedule: { en: 'My Schedule', fa: 'برنامه‌ی من' },
		student_my_balance: { en: 'My Balance', fa: 'حساب من' },
		student_sessions_held: { en: 'Sessions Held', fa: 'جلسات برگزارشده' },
		student_since_settlement: { en: 'Since Last Settlement', fa: 'از آخرین تسویه' },
		student_total_due: { en: 'Total Due', fa: 'مبلغ بدهی' },
	};

	function currentLang() {
		return localStorage.getItem( 'mahtela-lang' ) || 'en';
	}

	/**
	 * Formats a raw number as Toman with proper thousands grouping.
	 * Intl.NumberFormat handles both the 3-digit grouping and (for 'fa')
	 * the Persian numeral conversion automatically.
	 */
	function formatToman( amount, lang ) {
		var locale = lang === 'fa' ? 'fa-IR' : 'en-US';
		var formatted = new Intl.NumberFormat( locale ).format( Math.round( amount ) );
		var unit = lang === 'fa' ? 'تومان' : 'Toman';
		return formatted + ' ' + unit;
	}

	function applyCurrencies( lang ) {
		document.querySelectorAll( '[data-currency]' ).forEach( function ( el ) {
			var amount = parseFloat( el.getAttribute( 'data-currency' ) );
			if ( ! isNaN( amount ) ) {
				el.textContent = formatToman( amount, lang );
			}
		} );
	}

	function applyTranslations( lang ) {
		document.documentElement.lang = lang;
		document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

		document.querySelectorAll( '[data-i18n]' ).forEach( function ( el ) {
			var key = el.getAttribute( 'data-i18n' );
			if ( DICT[ key ] && DICT[ key ][ lang ] ) {
				el.textContent = DICT[ key ][ lang ];
			}
		} );
		document.querySelectorAll( '[data-i18n-ph]' ).forEach( function ( el ) {
			var key = el.getAttribute( 'data-i18n-ph' );
			if ( DICT[ key ] && DICT[ key ][ lang ] ) {
				el.setAttribute( 'placeholder', DICT[ key ][ lang ] );
			}
		} );

		document.querySelectorAll( '[data-lang-btn]' ).forEach( function ( btn ) {
			btn.textContent = lang === 'fa' ? 'EN' : 'FA';
			btn.setAttribute( 'aria-label', lang === 'fa' ? 'Switch to English' : 'Switch to Persian' );
		} );

		if ( window.mahtelaClock ) { window.mahtelaClock.update(); }
		applyCurrencies( lang );
		document.dispatchEvent( new CustomEvent( 'mahtela:langchange', { detail: { lang: lang } } ) );
	}

	function setLang( lang ) {
		localStorage.setItem( 'mahtela-lang', lang );
		applyTranslations( lang );
	}

	window.mahtelaI18n = { dict: DICT, apply: applyTranslations, setLang: setLang, currentLang: currentLang, formatToman: formatToman };

	document.addEventListener( 'DOMContentLoaded', function () {
		applyTranslations( currentLang() );
		document.querySelectorAll( '[data-lang-btn]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				setLang( currentLang() === 'fa' ? 'en' : 'fa' );
			} );
		} );
	} );
}() );
