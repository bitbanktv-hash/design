/**
 * Shared app-shell interactions used across every authenticated page.
 */
( function () {
	'use strict';

	function initSidebar() {
		var sidebar = document.querySelector( '.sidebar' );
		var backdrop = document.querySelector( '.sidebar-backdrop' );
		var toggles = document.querySelectorAll( '[data-sidebar-toggle]' );
		if ( ! sidebar ) { return; }

		function open() {
			sidebar.classList.add( 'is-open' );
			if ( backdrop ) { backdrop.classList.add( 'is-open' ); }
		}
		function close() {
			sidebar.classList.remove( 'is-open' );
			if ( backdrop ) { backdrop.classList.remove( 'is-open' ); }
		}

		toggles.forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				sidebar.classList.contains( 'is-open' ) ? close() : open();
			} );
		} );
		if ( backdrop ) { backdrop.addEventListener( 'click', close ); }
	}

	function initModals() {
		document.querySelectorAll( '[data-modal-open]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var id = btn.getAttribute( 'data-modal-open' );
				var modal = document.getElementById( id );
				if ( modal ) { modal.classList.add( 'is-open' ); document.body.style.overflow = 'hidden'; }
			} );
		} );
		document.querySelectorAll( '[data-modal-close]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var modal = btn.closest( '.modal-overlay' );
				if ( modal ) { modal.classList.remove( 'is-open' ); document.body.style.overflow = ''; }
			} );
		} );
		document.querySelectorAll( '.modal-overlay' ).forEach( function ( overlay ) {
			overlay.addEventListener( 'click', function ( e ) {
				if ( e.target === overlay ) {
					overlay.classList.remove( 'is-open' );
					document.body.style.overflow = '';
				}
			} );
		} );
	}

	function initTabs() {
		document.querySelectorAll( '[data-tabs]' ).forEach( function ( group ) {
			var groupName = group.getAttribute( 'data-tabs' );
			var buttons = document.querySelectorAll( '[data-tab-btn="' + groupName + '"]' );
			var panels = document.querySelectorAll( '[data-tab-panel="' + groupName + '"]' );

			buttons.forEach( function ( btn ) {
				btn.addEventListener( 'click', function () {
					var target = btn.getAttribute( 'data-tab-target' );

					buttons.forEach( function ( b ) { b.classList.remove( 'is-active' ); } );
					btn.classList.add( 'is-active' );

					panels.forEach( function ( panel ) {
						panel.classList.toggle( 'is-active', panel.getAttribute( 'data-tab-id' ) === target );
					} );

					if ( history.replaceState ) {
						history.replaceState( null, '', '#' + target );
					}
				} );
			} );

			// Deep-link support: open the tab named in the URL hash on load.
			var hash = window.location.hash.replace( '#', '' );
			if ( hash ) {
				var matchBtn = document.querySelector( '[data-tab-btn="' + groupName + '"][data-tab-target="' + hash + '"]' );
				if ( matchBtn ) { matchBtn.click(); }
			}
		} );
	}

	function initRevealOnLoad() {
		requestAnimationFrame( function () {
			requestAnimationFrame( function () {
				document.body.classList.add( 'is-ready' );
			} );
		} );
	}

	/**
	 * Live thousand-separator formatting for price/amount input fields as
	 * the person types, keeping the cursor in the right place as commas
	 * shift around it. Fields keep raw digits in the value for anything
	 * that reads them programmatically (the display formatting is purely
	 * visual).
	 */
	var DIGIT_RE = /[0-9]/;

	function formatCurrencyInputLive( input ) {
		var raw = input.value;
		var cursorPos = input.selectionStart == null ? raw.length : input.selectionStart;
		var digitsBeforeCursor = 0;
		for ( var i = 0; i < cursorPos; i++ ) {
			if ( DIGIT_RE.test( raw[ i ] ) ) { digitsBeforeCursor++; }
		}

		var digitsOnly = raw.replace( /[^0-9]/g, '' );
		var formatted = digitsOnly ? new Intl.NumberFormat( 'en-US' ).format( parseInt( digitsOnly, 10 ) ) : '';
		input.value = formatted;

		if ( digitsBeforeCursor === 0 ) {
			input.setSelectionRange( 0, 0 );
			return;
		}
		var count = 0, newPos = formatted.length;
		for ( var j = 0; j < formatted.length; j++ ) {
			if ( DIGIT_RE.test( formatted[ j ] ) ) { count++; }
			if ( count === digitsBeforeCursor ) { newPos = j + 1; break; }
		}
		input.setSelectionRange( newPos, newPos );
	}

	function initCurrencyInputs() {
		document.querySelectorAll( '.currency-input' ).forEach( function ( input ) {
			formatCurrencyInputLive( input );
			input.addEventListener( 'input', function () { formatCurrencyInputLive( input ); } );
		} );
	}

	/* ---------------------------------------------------------------
	 * Shared field validation (email / phone format).
	 * Real server-side validation still belongs on the backend -- this
	 * is the client-side UX layer that gives immediate feedback.
	 * ------------------------------------------------------------- */

	function isValidEmail( value ) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( value.trim() );
	}

	function isValidPhone( value ) {
		var digitsOnly = value.replace( /[^0-9]/g, '' );
		return digitsOnly.length >= 8 && digitsOnly.length <= 15;
	}

	function showFieldError( input, show ) {
		var field = input.closest( '.form-field' );
		if ( field ) { field.classList.toggle( 'has-error', show ); }
	}

	function validateEmailField( input ) {
		var valid = input.value.trim() === '' || isValidEmail( input.value );
		showFieldError( input, ! valid );
		return valid;
	}

	function validatePhoneField( input ) {
		var valid = input.value.trim() === '' || isValidPhone( input.value );
		showFieldError( input, ! valid );
		return valid;
	}

	function initFieldValidation() {
		document.querySelectorAll( '[data-validate="email"]' ).forEach( function ( input ) {
			input.addEventListener( 'blur', function () { validateEmailField( input ); } );
			input.addEventListener( 'input', function () { showFieldError( input, false ); } );
		} );
		document.querySelectorAll( '[data-validate="phone"]' ).forEach( function ( input ) {
			input.addEventListener( 'blur', function () { validatePhoneField( input ); } );
			input.addEventListener( 'input', function () { showFieldError( input, false ); } );
		} );
	}

	/**
	 * Validates every required/email/phone field inside a form element,
	 * marking each invalid one. Returns true only if everything passes --
	 * call this at the top of a submit handler before proceeding.
	 */
	function validateFormFields( form ) {
		var ok = true;
		form.querySelectorAll( '[data-validate="email"]' ).forEach( function ( input ) {
			if ( ! validateEmailField( input ) ) { ok = false; }
			if ( input.required && ! input.value.trim() ) { showFieldError( input, true ); ok = false; }
		} );
		form.querySelectorAll( '[data-validate="phone"]' ).forEach( function ( input ) {
			if ( ! validatePhoneField( input ) ) { ok = false; }
			if ( input.required && ! input.value.trim() ) { showFieldError( input, true ); ok = false; }
		} );
		return ok;
	}

	window.mahtelaValidate = {
		email: isValidEmail,
		phone: isValidPhone,
		validateEmailField: validateEmailField,
		validatePhoneField: validatePhoneField,
		validateForm: validateFormFields,
		showFieldError: showFieldError
	};

	function initToast() {
		window.mahtelaToast = function ( message, iconSvg ) {
			var existing = document.getElementById( 'mt-toast' );
			if ( existing ) { existing.remove(); }

			var toast = document.createElement( 'div' );
			toast.id = 'mt-toast';
			toast.className = 'toast';
			toast.innerHTML = ( iconSvg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>' ) + '<span>' + message + '</span>';
			document.body.appendChild( toast );

			requestAnimationFrame( function () {
				requestAnimationFrame( function () { toast.classList.add( 'is-visible' ); } );
			} );

			setTimeout( function () {
				toast.classList.remove( 'is-visible' );
				setTimeout( function () { toast.remove(); }, 350 );
			}, 2600 );
		};
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		initSidebar();
		initModals();
		initTabs();
		initRevealOnLoad();
		initToast();
		initCurrencyInputs();
		initFieldValidation();
	} );
}() );
