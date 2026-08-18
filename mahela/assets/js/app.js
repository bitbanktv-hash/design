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
		// An explicit open-order stack, not DOM order: two modals can be
		// open at once (e.g. Reset Password launched from inside the
		// Teacher's Students modal), and the one opened *most recently* is
		// the one Escape/Tab-trap must target -- which isn't necessarily
		// the one that comes later in the HTML source.
		var openStack = [];

		function getFocusable( container ) {
			return Array.prototype.slice.call(
				container.querySelectorAll(
					'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
			).filter( function ( el ) { return el.offsetParent !== null; } );
		}

		function openModal( modal, trigger ) {
			openStack.push( { modal: modal, trigger: trigger || document.activeElement } );
			modal.classList.add( 'is-open' );
			document.body.style.overflow = 'hidden';

			var target = modal.querySelector( '.modal-box__close' ) || getFocusable( modal )[ 0 ];
			if ( target ) { target.focus(); }
		}

		function closeModal( modal ) {
			var idx = -1;
			for ( var i = openStack.length - 1; i >= 0; i-- ) {
				if ( openStack[ i ].modal === modal ) { idx = i; break; }
			}
			var entry = idx !== -1 ? openStack.splice( idx, 1 )[ 0 ] : null;

			modal.classList.remove( 'is-open' );
			if ( ! openStack.length ) { document.body.style.overflow = ''; }
			if ( entry && entry.trigger && document.contains( entry.trigger ) ) { entry.trigger.focus(); }
		}

		// One-time ARIA setup: every .modal-box gets dialog semantics, tied
		// to its own .modal-box__title, so a screen reader announces the
		// modal's purpose the instant it opens.
		document.querySelectorAll( '.modal-overlay' ).forEach( function ( overlay, i ) {
			var box = overlay.querySelector( '.modal-box' );
			var title = overlay.querySelector( '.modal-box__title' );
			if ( ! box ) { return; }
			box.setAttribute( 'role', 'dialog' );
			box.setAttribute( 'aria-modal', 'true' );
			if ( title ) {
				if ( ! title.id ) { title.id = ( overlay.id || 'modal-' + i ) + '-title'; }
				box.setAttribute( 'aria-labelledby', title.id );
			}
		} );

		document.querySelectorAll( '[data-modal-open]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var id = btn.getAttribute( 'data-modal-open' );
				var modal = document.getElementById( id );
				if ( modal ) { openModal( modal, btn ); }
			} );
		} );
		document.querySelectorAll( '[data-modal-close]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var modal = btn.closest( '.modal-overlay' );
				if ( modal ) { closeModal( modal ); }
			} );
		} );
		document.querySelectorAll( '.modal-overlay' ).forEach( function ( overlay ) {
			overlay.addEventListener( 'click', function ( e ) {
				if ( e.target === overlay ) { closeModal( overlay ); }
			} );
		} );

		// Escape closes the topmost open modal; Tab is trapped inside it
		// while open, per the WAI-ARIA dialog (modal) pattern.
		document.addEventListener( 'keydown', function ( e ) {
			if ( ! openStack.length ) { return; }
			var top = openStack[ openStack.length - 1 ].modal;

			if ( e.key === 'Escape' ) {
				closeModal( top );
				return;
			}
			if ( e.key === 'Tab' ) {
				var focusable = getFocusable( top );
				if ( ! focusable.length ) { return; }
				var first = focusable[ 0 ];
				var last = focusable[ focusable.length - 1 ];

				if ( e.shiftKey && document.activeElement === first ) {
					e.preventDefault(); last.focus();
				} else if ( ! e.shiftKey && document.activeElement === last ) {
					e.preventDefault(); first.focus();
				}
			}
		} );

		// Exposed so page-specific inline scripts open/close modals through
		// the same path (ARIA setup already ran above at init) instead of
		// hand-rolling classList.add('is-open') and losing focus management.
		window.mahtelaModal = { open: openModal, close: closeModal };
	}

	function initTabs() {
		var hashHandlers = [];

		document.querySelectorAll( '[data-tabs]' ).forEach( function ( group ) {
			var groupName = group.getAttribute( 'data-tabs' );
			var buttons = Array.prototype.slice.call( document.querySelectorAll( '[data-tab-btn="' + groupName + '"]' ) );
			var panels = Array.prototype.slice.call( document.querySelectorAll( '[data-tab-panel="' + groupName + '"]' ) );

			// WAI-ARIA Tabs pattern: the group is a tablist, each button is
			// a tab wired to its panel, and only the active tab sits in the
			// Tab order (arrow keys move between the rest) -- built here in
			// JS since the whole tab interface already requires JS to work.
			group.setAttribute( 'role', 'tablist' );

			function tabId( target ) { return 'tab-' + groupName + '-' + target; }
			function panelId( target ) { return 'tabpanel-' + groupName + '-' + target; }

			buttons.forEach( function ( btn ) {
				var target = btn.getAttribute( 'data-tab-target' );
				var selected = btn.classList.contains( 'is-active' );
				btn.setAttribute( 'role', 'tab' );
				btn.id = tabId( target );
				btn.setAttribute( 'aria-controls', panelId( target ) );
				btn.setAttribute( 'aria-selected', selected ? 'true' : 'false' );
				btn.tabIndex = selected ? 0 : -1;
			} );

			panels.forEach( function ( panel ) {
				var id = panel.getAttribute( 'data-tab-id' );
				panel.setAttribute( 'role', 'tabpanel' );
				panel.id = panelId( id );
				panel.setAttribute( 'aria-labelledby', tabId( id ) );
				panel.tabIndex = 0;
			} );

			function activate( btn, moveFocus ) {
				var target = btn.getAttribute( 'data-tab-target' );

				buttons.forEach( function ( b ) {
					var isActive = b === btn;
					b.classList.toggle( 'is-active', isActive );
					b.setAttribute( 'aria-selected', isActive ? 'true' : 'false' );
					b.tabIndex = isActive ? 0 : -1;
				} );

				panels.forEach( function ( panel ) {
					panel.classList.toggle( 'is-active', panel.getAttribute( 'data-tab-id' ) === target );
				} );

				if ( moveFocus ) { btn.focus(); }

				if ( history.replaceState ) {
					history.replaceState( null, '', '#' + target );
				}
			}

			buttons.forEach( function ( btn, index ) {
				btn.addEventListener( 'click', function () { activate( btn, false ); } );

				btn.addEventListener( 'keydown', function ( e ) {
					var rtl = document.documentElement.getAttribute( 'dir' ) === 'rtl';
					var nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
					var prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';
					var newIndex = null;

					if ( e.key === nextKey ) { newIndex = ( index + 1 ) % buttons.length; }
					else if ( e.key === prevKey ) { newIndex = ( index - 1 + buttons.length ) % buttons.length; }
					else if ( e.key === 'Home' ) { newIndex = 0; }
					else if ( e.key === 'End' ) { newIndex = buttons.length - 1; }

					if ( newIndex !== null ) {
						e.preventDefault();
						activate( buttons[ newIndex ], true );
					}
				} );
			} );

			// Deep-link support: open the tab named in the URL hash. Run once
			// now (initial load) and register for re-checking on hashchange
			// below -- a same-page anchor click (e.g. a sidebar link to
			// "thispage.html#messages" while already on thispage.html)
			// updates the hash without a full reload, so DOMContentLoaded
			// never fires again and this needs to run a second time.
			function applyHash() {
				var hash = window.location.hash.replace( '#', '' );
				if ( ! hash ) { return; }
				var matchBtn = document.querySelector( '[data-tab-btn="' + groupName + '"][data-tab-target="' + hash + '"]' );
				if ( matchBtn ) { activate( matchBtn, false ); }
			}
			applyHash();
			hashHandlers.push( applyHash );
		} );

		window.addEventListener( 'hashchange', function () {
			hashHandlers.forEach( function ( fn ) { fn(); } );
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

	/**
	 * A field marked data-clear-on-focus starts with its current saved
	 * value visible (so the user can see what's already there), but the
	 * moment they click in to edit it, the value clears out so they can
	 * just start typing fresh -- no manually selecting and deleting the
	 * old text first. If they click away without typing anything, the
	 * original value is restored so nothing is accidentally lost.
	 */
	function initClearOnFocus() {
		document.querySelectorAll( '[data-clear-on-focus]' ).forEach( function ( input ) {
			var originalValue = input.value;
			input.addEventListener( 'focus', function () {
				originalValue = input.value;
				input.value = '';
			} );
			input.addEventListener( 'blur', function () {
				if ( input.value.trim() === '' ) { input.value = originalValue; }
			} );
		} );
	}

	function initToast() {
		window.mahtelaToast = function ( message, iconSvg ) {
			var existing = document.getElementById( 'mt-toast' );
			if ( existing ) { existing.remove(); }

			var toast = document.createElement( 'div' );
			toast.id = 'mt-toast';
			toast.className = 'toast';
			toast.setAttribute( 'role', 'status' );
			toast.setAttribute( 'aria-live', 'polite' );
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

	/**
	 * Segmented control (radiogroup of pill buttons) -- e.g. the session
	 * Status selector (Scheduled / Held / Cancelled). WAI-ARIA radiogroup
	 * pattern: roving tabindex, arrow keys move + select, click selects.
	 * Dispatches "seg-change" on the group element with detail.value set
	 * from the selected button's data-status attribute.
	 */
	function initSegControls() {
		document.querySelectorAll( '.seg-control[role="radiogroup"]' ).forEach( function ( group ) {
			var buttons = Array.prototype.slice.call( group.querySelectorAll( '.seg-control__btn[role="radio"]' ) );
			if ( ! buttons.length ) { return; }

			function selectButton( btn, dispatch ) {
				buttons.forEach( function ( b ) {
					var checked = b === btn;
					b.setAttribute( 'aria-checked', checked ? 'true' : 'false' );
					b.tabIndex = checked ? 0 : -1;
				} );
				if ( dispatch ) {
					group.dispatchEvent( new CustomEvent( 'seg-change', { bubbles: true, detail: { value: btn.getAttribute( 'data-status' ) } } ) );
				}
			}

			buttons.forEach( function ( btn, idx ) {
				btn.type = 'button';
				if ( ! btn.hasAttribute( 'aria-checked' ) ) { btn.setAttribute( 'aria-checked', 'false' ); }
				btn.tabIndex = ( btn.getAttribute( 'aria-checked' ) === 'true' || idx === 0 ) ? 0 : -1;
				btn.addEventListener( 'click', function () { selectButton( btn, true ); } );
				btn.addEventListener( 'keydown', function ( e ) {
					var i = buttons.indexOf( btn );
					var next = null;
					var isRtl = document.documentElement.dir === 'rtl';
					if ( e.key === 'ArrowDown' || ( isRtl ? e.key === 'ArrowLeft' : e.key === 'ArrowRight' ) ) {
						next = buttons[ ( i + 1 ) % buttons.length ];
					} else if ( e.key === 'ArrowUp' || ( isRtl ? e.key === 'ArrowRight' : e.key === 'ArrowLeft' ) ) {
						next = buttons[ ( i - 1 + buttons.length ) % buttons.length ];
					}
					if ( next ) { e.preventDefault(); next.focus(); selectButton( next, true ); }
				} );
			} );
		} );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		initSidebar();
		initModals();
		initTabs();
		initRevealOnLoad();
		initToast();
		initCurrencyInputs();
		initFieldValidation();
		initSegControls();
		initClearOnFocus();
	} );
}() );
