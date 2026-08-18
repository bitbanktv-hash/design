/**
 * Live clock + Gregorian/Jalali date, plus a small calendar-aware date
 * formatter (window.mahtelaCalendar) used everywhere else in the app that
 * displays a date (session lists, "next class" cards, etc.) so every date
 * on screen -- not just this clock widget -- honors the same calendar
 * choice. The Jalali conversion is the well-established public algorithm
 * (as used by jalaali-js), verified here against three known reference
 * points: Nowruz 1403 (2024-03-20), Nowruz 1404 (2025-03-21), and the 1979
 * Iranian Revolution date (1357-11-22).
 */
( function () {
	'use strict';

	function div( a, b ) { return ~~( a / b ); }
	function mod( a, b ) { return a - ~~( a / b ) * b; }

	function g2d( gy, gm, gd ) {
		var d = div( ( gy + div( gm - 8, 6 ) + 100100 ) * 1461, 4 )
			+ div( 153 * mod( gm + 9, 12 ) + 2, 5 )
			+ gd - 34840408;
		d = d - div( div( gy + 100100 + div( gm - 8, 6 ), 100 ) * 3, 4 ) + 752;
		return d;
	}

	function d2g( jdn ) {
		var j = 4 * jdn + 139361631;
		j = j + div( div( 4 * jdn + 183187720, 146097 ) * 3, 4 ) * 4 - 3908;
		var i = div( mod( j, 1461 ), 4 ) * 5 + 308;
		var gd = div( mod( i, 153 ), 5 ) + 1;
		var gm = mod( div( i, 153 ), 12 ) + 1;
		var gy = div( j, 1461 ) - 100100 + div( 8 - gm, 6 );
		return { gy: gy, gm: gm, gd: gd };
	}

	var BREAKS = [ -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178 ];

	function jalCal( jy ) {
		var bl = BREAKS.length;
		var gy = jy + 621;
		var leapJ = -14;
		var jp = BREAKS[ 0 ];
		var jump = 0;
		var jm;
		for ( var i = 1; i < bl; i += 1 ) {
			jm = BREAKS[ i ];
			jump = jm - jp;
			if ( jy < jm ) { break; }
			leapJ = leapJ + div( jump, 33 ) * 8 + div( mod( jump, 33 ), 4 );
			jp = jm;
		}
		var n = jy - jp;
		leapJ = leapJ + div( n, 33 ) * 8 + div( mod( n, 33 ) + 3, 4 );
		if ( mod( jump, 33 ) === 4 && jump - n === 4 ) { leapJ += 1; }
		var leapG = div( gy, 4 ) - div( ( div( gy, 100 ) + 1 ) * 3, 4 ) - 150;
		var march = 20 + leapJ - leapG;
		if ( jump - n < 6 ) { n = n - jump + div( jump + 4, 33 ) * 33; }
		var leap = mod( mod( n + 1, 33 ) - 1, 4 );
		if ( leap === -1 ) { leap = 4; }
		return { leap: leap, gy: gy, march: march };
	}

	function d2j( jdn ) {
		var gy = d2g( jdn ).gy;
		var jy = gy - 621;
		var r = jalCal( jy );
		var jdn1f = g2d( gy, 3, r.march );
		var k = jdn - jdn1f;
		var jm, jd;
		if ( k >= 0 ) {
			if ( k <= 185 ) {
				jm = 1 + div( k, 31 );
				jd = mod( k, 31 ) + 1;
				return { jy: jy, jm: jm, jd: jd };
			}
			k -= 186;
		} else {
			jy -= 1;
			k += 179;
			var r2 = jalCal( jy );
			if ( r2.leap === 1 ) { k += 1; }
		}
		jm = 7 + div( k, 30 );
		jd = mod( k, 30 ) + 1;
		return { jy: jy, jm: jm, jd: jd };
	}

	function gregorianToJalali( gy, gm, gd ) {
		return d2j( g2d( gy, gm, gd ) );
	}

	var JALALI_MONTHS_FA = [ 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند' ];
	var JALALI_MONTHS_EN = [ 'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand' ];
	var GREG_MONTHS_EN = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
	// Standard Persian transliterations for the Gregorian months (as used
	// in Persian news/formal writing) -- distinct from the Jalali month
	// names above, for when a Persian-language user has chosen the
	// Gregorian calendar rather than Jalali.
	var GREG_MONTHS_FA = [ 'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر' ];
	var WEEKDAYS_EN_ABBR = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	var WEEKDAYS_EN_FULL = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
	var WEEKDAYS_FA = [ 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه' ];
	var FA_DIGITS = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };
	var CALENDAR_STORAGE_KEY = 'mahtela-calendar';

	function toFaDigits( str ) {
		return String( str ).replace( /[0-9]/g, function ( d ) { return FA_DIGITS[ d ]; } );
	}

	function pad( n ) { return n < 10 ? '0' + n : '' + n; }

	/**
	 * Calendar preference is independent of UI language: a Persian-language
	 * user can still prefer the Gregorian calendar, and an English-language
	 * user can prefer Jalali. Unset (no explicit choice made yet) falls
	 * back to the natural pairing -- Jalali for fa, Gregorian for en --
	 * which is also what makes every schedule date on the site correctly
	 * switch to Shamsi the moment someone switches the UI to Persian,
	 * without forcing that choice permanently.
	 */
	function getCalendarPref() {
		var v = localStorage.getItem( CALENDAR_STORAGE_KEY );
		return ( v === 'jalali' || v === 'gregorian' ) ? v : null;
	}

	function resolveCalendar( lang ) {
		return getCalendarPref() || ( lang === 'fa' ? 'jalali' : 'gregorian' );
	}

	function setCalendarPref( value ) {
		if ( value !== 'jalali' && value !== 'gregorian' ) { return; }
		localStorage.setItem( CALENDAR_STORAGE_KEY, value );
		updateClock();
		applyScheduleDates();
		document.dispatchEvent( new CustomEvent( 'mahtela:calendarchange', { detail: { calendar: value } } ) );
	}

	function updateClock() {
		var els = document.querySelectorAll( '[data-clock-widget]' );
		if ( ! els.length ) { return; }

		var now = new Date();
		var lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
		var calendar = resolveCalendar( lang );

		var timeStr = pad( now.getHours() ) + ':' + pad( now.getMinutes() ) + ':' + pad( now.getSeconds() );
		if ( lang === 'fa' ) { timeStr = toFaDigits( timeStr ); }

		var dateStr;
		if ( calendar === 'jalali' ) {
			var j = gregorianToJalali( now.getFullYear(), now.getMonth() + 1, now.getDate() );
			dateStr = lang === 'fa'
				? JALALI_MONTHS_FA[ j.jm - 1 ] + ' ' + toFaDigits( j.jd ) + '، ' + toFaDigits( j.jy )
				: JALALI_MONTHS_EN[ j.jm - 1 ] + ' ' + j.jd + ', ' + j.jy;
		} else {
			dateStr = lang === 'fa'
				? GREG_MONTHS_FA[ now.getMonth() ] + ' ' + toFaDigits( now.getDate() ) + '، ' + toFaDigits( now.getFullYear() )
				: GREG_MONTHS_EN[ now.getMonth() ] + ' ' + now.getDate() + ', ' + now.getFullYear();
		}

		els.forEach( function ( widget ) {
			var timeEl = widget.querySelector( '[data-clock-time]' );
			var gregEl = widget.querySelector( '[data-clock-gregorian]' );
			var jalEl = widget.querySelector( '[data-clock-jalali]' );
			var sepEl = widget.querySelector( '[data-clock-sep]' );
			if ( timeEl ) { timeEl.textContent = timeStr; }

			// Only one calendar shows at a time now -- which slot carries
			// the date depends on the user's choice, not their language.
			// Showing both was fine when language implied the calendar;
			// now that they're independent, showing the one *not* chosen
			// would contradict the setting.
			var primaryEl = calendar === 'jalali' ? jalEl : gregEl;
			var hiddenEl = calendar === 'jalali' ? gregEl : jalEl;
			if ( primaryEl ) { primaryEl.textContent = dateStr; primaryEl.style.display = ''; }
			if ( hiddenEl ) { hiddenEl.style.display = 'none'; }
			if ( sepEl ) { sepEl.style.display = 'none'; }
		} );
	}

	/**
	 * Renders every calendar-aware date on the page from a machine-readable
	 * ISO date, so schedule/session dates react to language AND calendar
	 * changes exactly like the clock widget already did -- this is the
	 * piece that was missing before (dates were static text baked into the
	 * HTML and never re-rendered).
	 *
	 * Usage: put data-date="YYYY-MM-DD" (optionally + data-time="HH:MM") on
	 * a container. If it has descendants tagged data-date-part="day" /
	 * "month" / "weekday", only those get filled (for compact calendar-card
	 * layouts); otherwise the container's own text becomes the full
	 * "Weekday, Month Day · HH:MM" string.
	 */
	function dateParts( iso ) {
		var bits = iso.split( '-' );
		return { y: parseInt( bits[ 0 ], 10 ), m: parseInt( bits[ 1 ], 10 ), d: parseInt( bits[ 2 ], 10 ) };
	}

	function formatDatePieces( iso, lang ) {
		var p = dateParts( iso );
		// Local-midnight construction (not Date.parse on the ISO string)
		// avoids the classic UTC-parse/local-render off-by-one-day bug.
		var weekdayIdx = new Date( p.y, p.m - 1, p.d ).getDay();
		var calendar = resolveCalendar( lang );

		if ( calendar === 'jalali' ) {
			var j = gregorianToJalali( p.y, p.m, p.d );
			return {
				day: lang === 'fa' ? toFaDigits( j.jd ) : String( j.jd ),
				month: lang === 'fa' ? JALALI_MONTHS_FA[ j.jm - 1 ] : JALALI_MONTHS_EN[ j.jm - 1 ].slice( 0, 3 ),
				year: lang === 'fa' ? toFaDigits( j.jy ) : String( j.jy ),
				weekday: lang === 'fa' ? WEEKDAYS_FA[ weekdayIdx ] : WEEKDAYS_EN_ABBR[ weekdayIdx ],
				weekdayFull: lang === 'fa' ? WEEKDAYS_FA[ weekdayIdx ] : WEEKDAYS_EN_FULL[ weekdayIdx ]
			};
		}
		return {
			day: lang === 'fa' ? toFaDigits( p.d ) : String( p.d ),
			month: lang === 'fa' ? GREG_MONTHS_FA[ p.m - 1 ].slice( 0, 3 ) : GREG_MONTHS_EN[ p.m - 1 ].slice( 0, 3 ),
			year: lang === 'fa' ? toFaDigits( p.y ) : String( p.y ),
			weekday: lang === 'fa' ? WEEKDAYS_FA[ weekdayIdx ] : WEEKDAYS_EN_ABBR[ weekdayIdx ],
			weekdayFull: lang === 'fa' ? WEEKDAYS_FA[ weekdayIdx ] : WEEKDAYS_EN_FULL[ weekdayIdx ]
		};
	}

	function formatScheduleDate( iso, timeStr, lang ) {
		var parts = formatDatePieces( iso, lang );
		var out = parts.weekday + ( lang === 'fa' ? '، ' : ', ' ) + parts.month + ' ' + parts.day;
		if ( timeStr ) { out += ' · ' + ( lang === 'fa' ? toFaDigits( timeStr ) : timeStr ); }
		return out;
	}

	// "Month Day, Year" -- no weekday. Used for things like "Student since"
	// or a settlement period's start/end date, as opposed to
	// formatScheduleDate's "Weekday, Month Day [· time]" for session rows.
	function formatFullDate( iso, lang ) {
		var parts = formatDatePieces( iso, lang );
		return lang === 'fa'
			? parts.month + ' ' + parts.day + '، ' + parts.year
			: parts.month + ' ' + parts.day + ', ' + parts.year;
	}

	function applyScheduleDates() {
		var lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
		document.querySelectorAll( '[data-date]' ).forEach( function ( container ) {
			var iso = container.getAttribute( 'data-date' );
			if ( ! iso ) { return; }
			var parts = formatDatePieces( iso, lang );
			var partEls = container.querySelectorAll( '[data-date-part]' );

			if ( partEls.length ) {
				partEls.forEach( function ( el ) {
					var which = el.getAttribute( 'data-date-part' );
					if ( which === 'day' ) { el.textContent = parts.day; }
					else if ( which === 'month' ) { el.textContent = parts.month; }
					else if ( which === 'weekday' ) { el.textContent = parts.weekdayFull; }
				} );
			} else if ( container.getAttribute( 'data-date-style' ) === 'full' ) {
				container.textContent = formatFullDate( iso, lang );
			} else {
				container.textContent = formatScheduleDate( iso, container.getAttribute( 'data-time' ), lang );
			}
		} );
	}

	window.mahtelaClock = { update: updateClock, gregorianToJalali: gregorianToJalali };
	window.mahtelaCalendar = {
		getPreference: getCalendarPref,
		resolve: resolveCalendar,
		setPreference: setCalendarPref,
		formatScheduleDate: formatScheduleDate,
		formatFullDate: formatFullDate,
		applyScheduleDates: applyScheduleDates
	};

	document.addEventListener( 'DOMContentLoaded', function () {
		updateClock();
		applyScheduleDates();
		setInterval( updateClock, 1000 );
	} );
	document.addEventListener( 'mahtela:langchange', applyScheduleDates );
}() );
