/**
 * Dark / light theme toggle, persisted in localStorage.
 */
( function () {
	'use strict';

	function currentTheme() {
		return localStorage.getItem( 'mahtela-theme' ) || 'light';
	}

	function applyTheme( theme ) {
		document.documentElement.setAttribute( 'data-theme', theme );
		document.querySelectorAll( '[data-theme-btn]' ).forEach( function ( btn ) {
			var sun = btn.querySelector( '[data-icon-sun]' );
			var moon = btn.querySelector( '[data-icon-moon]' );
			if ( sun && moon ) {
				sun.style.display = theme === 'dark' ? 'block' : 'none';
				moon.style.display = theme === 'dark' ? 'none' : 'block';
			}
		} );
	}

	function setTheme( theme ) {
		localStorage.setItem( 'mahtela-theme', theme );
		applyTheme( theme );
	}

	window.mahtelaTheme = { apply: applyTheme, set: setTheme, current: currentTheme };

	// Apply immediately (before DOMContentLoaded) to avoid a flash of the
	// wrong theme on load.
	applyTheme( currentTheme() );

	document.addEventListener( 'DOMContentLoaded', function () {
		applyTheme( currentTheme() );
		document.querySelectorAll( '[data-theme-btn]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				setTheme( currentTheme() === 'dark' ? 'light' : 'dark' );
			} );
		} );
	} );
}() );
