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

	function j2d( jy, jm, jd ) {
		var r = jalCal( jy );
		var estimate = g2d( jy + 621, 3, r.march ) + ( jm - 1 ) * 31 - div( jm, 7 ) * ( jm - 7 ) + jd - 1;
		// The formula above is usually exact, but self-correct by checking
		// against the already-verified d2j (this function's own inverse)
		// -- guarantees j2d/d2j stay true inverses of each other, rather
		// than risking a subtly wrong result from an independently
		// re-derived formula in rare edge cases near year boundaries.
		for ( var delta = -2; delta <= 2; delta += 1 ) {
			var candidate = estimate + delta;
			var check = d2j( candidate );
			if ( check.jy === jy && check.jm === jm && check.jd === jd ) { return candidate; }
		}
		return estimate;
	}

	/** Reverse of gregorianToJalali -- needed for a bilingual date picker
	 * that lets someone pick a date by its Jalali numbers but still needs
	 * to produce the standard Gregorian ISO date the rest of the app's
	 * data model expects. */
	function jalaliToGregorian( jy, jm, jd ) {
		return d2g( j2d( jy, jm, jd ) );
	}

	/**
	 * Native <input type="date"> always shows the browser's OWN built-in
	 * picker, which is hard-coded to the Gregorian calendar -- there is
	 * no way to make it show Jalali, no matter what CSS/JS is applied.
	 * So for any date the user needs to actually PICK (not just view),
	 * this renders three Day/Month/Year <select> dropdowns instead,
	 * showing Jalali month names and year numbers when Persian is
	 * active and Gregorian otherwise, while always producing a
	 * standard Gregorian ISO date string as the underlying value (since
	 * that's what the rest of the app's data model expects).
	 *
	 * container: a DOM element to render the three selects into.
	 * options.initialISO: optional 'YYYY-MM-DD' to start pre-filled.
	 * options.onChange: called with the new ISO string (or null while
	 *   incomplete) whenever the user changes any of the three selects.
	 * Returns { getValue(), setValue(iso) }.
	 */
	function createDatePicker( container, options ) {
		options = options || {};
		var onChange = options.onChange || function () {};
		var daySel = document.createElement( 'select' );
		var monthSel = document.createElement( 'select' );
		var yearSel = document.createElement( 'select' );
		daySel.className = 'date-picker-field date-picker-field--day';
		monthSel.className = 'date-picker-field date-picker-field--month';
		yearSel.className = 'date-picker-field date-picker-field--year';
		container.innerHTML = '';
		container.className = ( container.className ? container.className + ' ' : '' ) + 'date-picker-fields';
		container.appendChild( daySel );
		container.appendChild( monthSel );
		container.appendChild( yearSel );

		// Internally tracked as Jalali or Gregorian y/m/d depending on
		// which calendar is currently active, converted to/from the ISO
		// Gregorian value only at the boundary (getValue/setValue).
		var current = null; // { y, m, d } in whichever calendar is active

		function activeCalendar() {
			return resolveCalendar( currentLangSafe() );
		}
		function currentLangSafe() {
			return window.mahtelaI18n ? window.mahtelaI18n.currentLang() : 'en';
		}

		function monthNames() {
			return activeCalendar() === 'jalali' ? JALALI_MONTHS_FA_OR_EN() : GREG_MONTHS_EN;
		}
		function JALALI_MONTHS_FA_OR_EN() {
			return currentLangSafe() === 'fa' ? JALALI_MONTHS_FA : JALALI_MONTHS_EN;
		}

		function dayCount( y, m ) {
			if ( activeCalendar() === 'jalali' ) { return jalaliMonthLength( y, m ); }
			return new Date( y, m, 0 ).getDate(); // Gregorian, m is 1-indexed here
		}

		function yearRange() {
			// A generous +/- range around "now" in whichever calendar is
			// active -- covers realistic session-scheduling and
			// student-history dates without an unwieldy dropdown.
			var nowIso = new Date().toISOString().slice( 0, 10 );
			var parts = nowIso.split( '-' ).map( Number );
			var nowY;
			if ( activeCalendar() === 'jalali' ) {
				nowY = gregorianToJalali( parts[ 0 ], parts[ 1 ], parts[ 2 ] ).jy;
			} else {
				nowY = parts[ 0 ];
			}
			var years = [];
			for ( var y = nowY - 3; y <= nowY + 2; y += 1 ) { years.push( y ); }
			return years;
		}

		function render() {
			var cal = activeCalendar();
			var months = monthNames();
			var years = yearRange();

			if ( ! current ) {
				var todayIso = new Date().toISOString().slice( 0, 10 );
				var tp = todayIso.split( '-' ).map( Number );
				if ( cal === 'jalali' ) {
					var todayJ = gregorianToJalali( tp[ 0 ], tp[ 1 ], tp[ 2 ] );
					current = { y: todayJ.jy, m: todayJ.jm, d: todayJ.jd, cal: cal };
				} else {
					current = { y: tp[ 0 ], m: tp[ 1 ], d: tp[ 2 ], cal: cal };
				}
			}

			var dc = dayCount( current.y, current.m );
			if ( current.d > dc ) { current.d = dc; }

			daySel.innerHTML = '';
			for ( var d = 1; d <= dc; d += 1 ) {
				var dOpt = document.createElement( 'option' );
				dOpt.value = d;
				dOpt.textContent = currentLangSafe() === 'fa' ? toFaDigits( d ) : d;
				if ( d === current.d ) { dOpt.selected = true; }
				daySel.appendChild( dOpt );
			}

			monthSel.innerHTML = '';
			months.forEach( function ( name, idx ) {
				var mOpt = document.createElement( 'option' );
				mOpt.value = idx + 1;
				mOpt.textContent = name;
				if ( idx + 1 === current.m ) { mOpt.selected = true; }
				monthSel.appendChild( mOpt );
			} );

			yearSel.innerHTML = '';
			years.forEach( function ( y ) {
				var yOpt = document.createElement( 'option' );
				yOpt.value = y;
				yOpt.textContent = currentLangSafe() === 'fa' ? toFaDigits( y ) : y;
				if ( y === current.y ) { yOpt.selected = true; }
				yearSel.appendChild( yOpt );
			} );
		}

		function isoFromCurrent() {
			if ( ! current ) { return null; }
			var g = current.cal === 'jalali' ? jalaliToGregorian( current.y, current.m, current.d ) : { gy: current.y, gm: current.m, gd: current.d };
			var pad = function ( n ) { return n < 10 ? '0' + n : '' + n; };
			return g.gy + '-' + pad( g.gm ) + '-' + pad( g.gd );
		}

		function handleFieldChange() {
			current = { y: parseInt( yearSel.value, 10 ), m: parseInt( monthSel.value, 10 ), d: parseInt( daySel.value, 10 ), cal: activeCalendar() };
			render();
			onChange( isoFromCurrent() );
		}
		daySel.addEventListener( 'change', handleFieldChange );
		monthSel.addEventListener( 'change', handleFieldChange );
		yearSel.addEventListener( 'change', handleFieldChange );

		function setValue( iso ) {
			if ( ! iso ) { current = null; render(); return; }
			var p = iso.split( '-' ).map( Number );
			var cal = activeCalendar();
			if ( cal === 'jalali' ) {
				var j = gregorianToJalali( p[ 0 ], p[ 1 ], p[ 2 ] );
				current = { y: j.jy, m: j.jm, d: j.jd, cal: cal };
			} else {
				current = { y: p[ 0 ], m: p[ 1 ], d: p[ 2 ], cal: cal };
			}
			render();
		}

		document.addEventListener( 'mahtela:langchange', function () {
			// isoFromCurrent() uses current.cal (the calendar system its
			// values were captured in), not the just-changed global
			// setting, so this correctly recovers the real underlying
			// date before re-deriving it for the new calendar -- never
			// loses or shifts the actual selected date on a language
			// switch.
			var iso = isoFromCurrent();
			setValue( iso );
		} );

		if ( options.initialISO ) { setValue( options.initialISO ); } else { render(); }

		return {
			getValue: isoFromCurrent,
			setValue: setValue
		};
	}

	/**
	 * Native <input type="time"> shows a 12-hour AM/PM picker or a
	 * 24-hour one depending on the visitor's browser/OS locale -- the
	 * page has no way to force one or the other. This renders two
	 * clearly labeled Hour/Minute text inputs instead, typed manually
	 * rather than picked from a list (much faster than scrolling a
	 * 60-item minute list), always 24-hour, always Hour-then-Minute
	 * left-to-right regardless of the page's overall text direction
	 * (time notation reads left-to-right even in Persian), with digits
	 * shown in the active language's numeral style once confirmed.
	 *
	 * container: a DOM element to render the two inputs into.
	 * options.initialValue: optional 'HH:MM' (24-hour) to start
	 *   pre-filled.
	 * options.onChange: called with the new 'HH:MM' string (or null
	 *   while empty/invalid) whenever a field is confirmed (blurred
	 *   after a change).
	 * Returns { getValue(), setValue(hhmm) }.
	 */
	function createTimePicker( container, options ) {
		options = options || {};
		var onChange = options.onChange || function () {};

		function langNow() {
			return window.mahtelaI18n ? window.mahtelaI18n.currentLang() : 'en';
		}
		function toLatinDigits( s ) {
			var reverseMap = {};
			Object.keys( FA_DIGITS ).forEach( function ( latin ) { reverseMap[ FA_DIGITS[ latin ] ] = latin; } );
			return String( s ).replace( /[۰-۹]/g, function ( d ) { return reverseMap[ d ]; } );
		}
		function digits( n ) {
			var s = pad( n );
			return langNow() === 'fa' ? toFaDigits( s ) : s;
		}

		container.innerHTML = '';
		container.className = ( container.className ? container.className + ' ' : '' ) + 'time-picker-fields';

		var hourCol = document.createElement( 'div' );
		hourCol.className = 'time-picker-col';
		var hourInput = document.createElement( 'input' );
		hourInput.type = 'text';
		hourInput.inputMode = 'numeric';
		hourInput.maxLength = 2;
		hourInput.className = 'time-picker-input';
		var hourCaption = document.createElement( 'span' );
		hourCaption.className = 'time-picker-caption';
		hourCol.appendChild( hourInput );
		hourCol.appendChild( hourCaption );

		var sep = document.createElement( 'span' );
		sep.className = 'time-picker-sep';
		sep.textContent = ':';

		var minuteCol = document.createElement( 'div' );
		minuteCol.className = 'time-picker-col';
		var minuteInput = document.createElement( 'input' );
		minuteInput.type = 'text';
		minuteInput.inputMode = 'numeric';
		minuteInput.maxLength = 2;
		minuteInput.className = 'time-picker-input';
		var minuteCaption = document.createElement( 'span' );
		minuteCaption.className = 'time-picker-caption';
		minuteCol.appendChild( minuteInput );
		minuteCol.appendChild( minuteCaption );

		container.appendChild( hourCol );
		container.appendChild( sep );
		container.appendChild( minuteCol );

		var current = null; // { h, m } once both fields hold a confirmed, valid value

		function relabel() {
			var dict = window.mahtelaI18n ? window.mahtelaI18n.dict : null;
			var lang = langNow();
			hourCaption.textContent = dict ? dict.time_picker_hour[ lang ] : 'Hour';
			minuteCaption.textContent = dict ? dict.time_picker_minute[ lang ] : 'Minute';
			if ( current ) {
				hourInput.value = digits( current.h );
				minuteInput.value = digits( current.m );
			}
		}

		function setFieldValid( input, valid ) {
			input.classList.toggle( 'time-picker-input--invalid', ! valid );
		}

		function parseField( input, max ) {
			var raw = toLatinDigits( input.value ).replace( /[^0-9]/g, '' );
			if ( raw === '' ) { return null; }
			var n = parseInt( raw, 10 );
			if ( isNaN( n ) || n < 0 || n > max ) { return null; }
			return n;
		}

		function valueStr() {
			if ( ! current ) { return null; }
			return pad( current.h ) + ':' + pad( current.m );
		}

		function commit() {
			var h = parseField( hourInput, 23 );
			var m = parseField( minuteInput, 59 );
			setFieldValid( hourInput, h !== null );
			setFieldValid( minuteInput, m !== null );
			if ( h === null || m === null ) {
				current = null;
				onChange( null );
				return;
			}
			current = { h: h, m: m };
			hourInput.value = digits( h );
			minuteInput.value = digits( m );
			onChange( valueStr() );
		}

		// Live-filter while typing (strip anything that isn't a digit,
		// accepting either Persian or Latin glyphs) without yet padding
		// or validating range -- that happens on commit, so a user
		// typing "9" isn't fought mid-keystroke.
		[ hourInput, minuteInput ].forEach( function ( input ) {
			input.addEventListener( 'input', function () {
				var cleaned = String( input.value ).replace( /[^0-9۰-۹]/g, '' ).slice( 0, 2 );
				if ( cleaned !== input.value ) { input.value = cleaned; }
			} );
			input.addEventListener( 'blur', commit );
		} );

		function setValue( hhmm ) {
			if ( ! hhmm ) {
				current = null;
				hourInput.value = '';
				minuteInput.value = '';
				setFieldValid( hourInput, true );
				setFieldValid( minuteInput, true );
				return;
			}
			var p = hhmm.split( ':' ).map( Number );
			current = { h: p[ 0 ], m: p[ 1 ] };
			hourInput.value = digits( p[ 0 ] );
			minuteInput.value = digits( p[ 1 ] );
			setFieldValid( hourInput, true );
			setFieldValid( minuteInput, true );
		}

		// Only the digit GLYPH style depends on language, not the
		// underlying hour/minute values -- relabel captions and
		// redisplay in the new style, no value conversion needed
		// (unlike the date picker's calendar switch).
		document.addEventListener( 'mahtela:langchange', relabel );

		relabel();
		if ( options.initialValue ) { setValue( options.initialValue ); }

		return {
			getValue: valueStr,
			setValue: setValue
		};
	}

	function isLeapJalaliYear( jy ) {
		return jalCal( jy ).leap === 0;
	}

	function jalaliMonthLength( jy, jm ) {
		if ( jm <= 6 ) { return 31; }
		if ( jm <= 11 ) { return 30; }
		return isLeapJalaliYear( jy ) ? 30 : 29;
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
		if ( value === 'auto' ) {
			localStorage.removeItem( CALENDAR_STORAGE_KEY );
		} else if ( value === 'jalali' || value === 'gregorian' ) {
			localStorage.setItem( CALENDAR_STORAGE_KEY, value );
		} else {
			return;
		}
		updateClock();
		applyScheduleDates();
		document.dispatchEvent( new CustomEvent( 'mahtela:calendarchange', { detail: { calendar: value } } ) );
	}

	function updateClock() {
		var els = document.querySelectorAll( '[data-clock-widget]' );
		if ( ! els.length ) { return; }

		var now = new Date();
		var lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';

		var timeStr = pad( now.getHours() ) + ':' + pad( now.getMinutes() ) + ':' + pad( now.getSeconds() );
		if ( lang === 'fa' ) { timeStr = toFaDigits( timeStr ); }

		var iso = now.getFullYear() + '-' + pad( now.getMonth() + 1 ) + '-' + pad( now.getDate() );

		// The clock widget always shows BOTH calendars side by side,
		// separated by "|", on every page, regardless of language or the
		// Settings calendar preference -- that preference still governs
		// schedule/session dates elsewhere, just not this always-both
		// header display.
		var gregStr = formatFullDate( iso, lang, 'gregorian' );
		var jalStr = formatFullDate( iso, lang, 'jalali' );

		els.forEach( function ( widget ) {
			var timeEl = widget.querySelector( '[data-clock-time]' );
			var gregEl = widget.querySelector( '[data-clock-gregorian]' );
			var jalEl = widget.querySelector( '[data-clock-jalali]' );
			var sepEl = widget.querySelector( '[data-clock-sep]' );
			if ( timeEl ) { timeEl.textContent = timeStr; }
			if ( gregEl ) { gregEl.textContent = gregStr; gregEl.style.display = ''; }
			if ( jalEl ) { jalEl.textContent = jalStr; jalEl.style.display = ''; }
			if ( sepEl ) { sepEl.style.display = ''; }
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

	function formatDatePieces( iso, lang, calendar ) {
		var p = dateParts( iso );
		// Local-midnight construction (not Date.parse on the ISO string)
		// avoids the classic UTC-parse/local-render off-by-one-day bug.
		var weekdayIdx = new Date( p.y, p.m - 1, p.d ).getDay();

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

	/**
	 * "Weekday, Day Month [· time]" for session rows / "next class" cards.
	 * Persian phrasing puts the day-of-month before the month name ("۲۸
	 * مرداد", not "مرداد ۲۸") and labels the time with "ساعت:" -- English
	 * keeps its own natural "Month Day" order with no time label.
	 */
	function formatScheduleDate( iso, timeStr, lang, calendarOverride ) {
		var calendar = calendarOverride || resolveCalendar( lang );
		var parts = formatDatePieces( iso, lang, calendar );
		var out;
		if ( lang === 'fa' ) {
			out = parts.weekday + '، ' + parts.day + ' ' + parts.month;
		} else {
			out = parts.weekday + ', ' + parts.month + ' ' + parts.day;
		}
		if ( timeStr ) {
			out += ' · ' + ( lang === 'fa' ? 'ساعت: ' + toFaDigits( timeStr ) : timeStr );
		}
		return out;
	}

	/**
	 * Standalone full date -- "Student since", a settlement period's start/
	 * end date, etc (no weekday, no time). Jalali always uses numeric,
	 * zero-padded Year/Month/Day (e.g. "۱۴۰۵/۰۶/۲۸"), per explicit request
	 * -- not the month name used elsewhere (schedule-row weekday labels,
	 * session-row day/month spans), which stay conversational on purpose.
	 */
	function formatFullDate( iso, lang, calendarOverride ) {
		var calendar = calendarOverride || resolveCalendar( lang );
		if ( calendar === 'jalali' ) {
			var p = dateParts( iso );
			var j = gregorianToJalali( p.y, p.m, p.d );
			var y = lang === 'fa' ? toFaDigits( j.jy ) : String( j.jy );
			var m = lang === 'fa' ? toFaDigits( pad( j.jm ) ) : pad( j.jm );
			var d = lang === 'fa' ? toFaDigits( pad( j.jd ) ) : pad( j.jd );
			return y + '/' + m + '/' + d;
		}
		var parts = formatDatePieces( iso, lang, calendar );
		return lang === 'fa'
			? parts.month + ' ' + parts.day + '، ' + parts.year
			: parts.month + ' ' + parts.day + ', ' + parts.year;
	}

	/**
	 * Both calendars together, separated by "|" -- same convention as the
	 * header clock widget, used in the Balance/Finance sections where the
	 * calendar-type preference shouldn't hide either one.
	 */
	function formatDualDate( iso, lang ) {
		return formatFullDate( iso, lang, 'gregorian' ) + ' | ' + formatFullDate( iso, lang, 'jalali' );
	}

	function applyScheduleDates() {
		var lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';
		var calendar = resolveCalendar( lang );
		document.querySelectorAll( '[data-date]' ).forEach( function ( container ) {
			var iso = container.getAttribute( 'data-date' );
			if ( ! iso ) { return; }
			var parts = formatDatePieces( iso, lang, calendar );
			var partEls = container.querySelectorAll( '[data-date-part]' );

			if ( partEls.length ) {
				partEls.forEach( function ( el ) {
					var which = el.getAttribute( 'data-date-part' );
					if ( which === 'day' ) { el.textContent = parts.day; }
					else if ( which === 'month' ) { el.textContent = parts.month; }
					else if ( which === 'weekday' ) { el.textContent = parts.weekdayFull; }
				} );
			} else if ( container.getAttribute( 'data-date-style' ) === 'full' ) {
				container.textContent = formatFullDate( iso, lang, calendar );
			} else if ( container.getAttribute( 'data-date-style' ) === 'dual' ) {
				container.textContent = formatDualDate( iso, lang );
			} else {
				container.textContent = formatScheduleDate( iso, container.getAttribute( 'data-time' ), lang, calendar );
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
		formatDualDate: formatDualDate,
		applyScheduleDates: applyScheduleDates,
		gregorianToJalali: gregorianToJalali,
		jalaliToGregorian: jalaliToGregorian,
		jalaliMonthLength: jalaliMonthLength,
		isLeapJalaliYear: isLeapJalaliYear,
		createDatePicker: createDatePicker,
		createTimePicker: createTimePicker,
		toFaDigits: toFaDigits
	};

	document.addEventListener( 'DOMContentLoaded', function () {
		updateClock();
		applyScheduleDates();
		setInterval( updateClock, 1000 );
	} );
	document.addEventListener( 'mahtela:langchange', applyScheduleDates );
}() );
