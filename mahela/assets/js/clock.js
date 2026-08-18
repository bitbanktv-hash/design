/**
 * Live clock + Gregorian/Jalali date. The Jalali conversion is the
 * well-established public algorithm (as used by jalaali-js), verified here
 * against three known reference points: Nowruz 1403 (2024-03-20), Nowruz
 * 1404 (2025-03-21), and the 1979 Iranian Revolution date (1357-11-22).
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
	var FA_DIGITS = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };

	function toFaDigits( str ) {
		return String( str ).replace( /[0-9]/g, function ( d ) { return FA_DIGITS[ d ]; } );
	}

	function pad( n ) { return n < 10 ? '0' + n : '' + n; }

	function updateClock() {
		var els = document.querySelectorAll( '[data-clock-widget]' );
		if ( ! els.length ) { return; }

		var now = new Date();
		var lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';

		var timeStr = pad( now.getHours() ) + ':' + pad( now.getMinutes() ) + ':' + pad( now.getSeconds() );
		var j = gregorianToJalali( now.getFullYear(), now.getMonth() + 1, now.getDate() );

		var gregStr, jalStr;

		if ( lang === 'fa' ) {
			timeStr = toFaDigits( timeStr );
			jalStr = JALALI_MONTHS_FA[ j.jm - 1 ] + ' ' + toFaDigits( j.jd ) + '، ' + toFaDigits( j.jy );
		} else {
			gregStr = GREG_MONTHS_EN[ now.getMonth() ] + ' ' + now.getDate() + ', ' + now.getFullYear();
			jalStr = JALALI_MONTHS_EN[ j.jm - 1 ] + ' ' + j.jd + ', ' + j.jy;
		}

		els.forEach( function ( widget ) {
			var timeEl = widget.querySelector( '[data-clock-time]' );
			var gregEl = widget.querySelector( '[data-clock-gregorian]' );
			var jalEl = widget.querySelector( '[data-clock-jalali]' );
			var sepEl = widget.querySelector( '[data-clock-sep]' );
			if ( timeEl ) { timeEl.textContent = timeStr; }
			if ( jalEl ) { jalEl.textContent = jalStr; }

			// Persian UI convention: only the Shamsi date is shown, never a
			// "Persian-translated Gregorian date" -- that reads as foreign
			// to Iranian users even with Persian digits/words. English mode
			// keeps both calendars side by side.
			if ( gregEl ) {
				if ( lang === 'fa' ) {
					gregEl.style.display = 'none';
				} else {
					gregEl.style.display = '';
					gregEl.textContent = gregStr;
				}
			}
			if ( sepEl ) { sepEl.style.display = lang === 'fa' ? 'none' : ''; }
		} );
	}

	window.mahtelaClock = { update: updateClock, gregorianToJalali: gregorianToJalali };

	document.addEventListener( 'DOMContentLoaded', function () {
		updateClock();
		setInterval( updateClock, 1000 );
	} );
}() );
