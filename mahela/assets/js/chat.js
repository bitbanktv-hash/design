/**
 * Shared rich-text + emoji chat composer, used by any page with a
 * .chat-composer element (messages.html's inbox, student-detail.html's
 * per-student Messages tab). The composer itself only knows how to edit
 * and emit a "chat-composer:send" CustomEvent with the typed HTML -- each
 * page decides what to do with it (append a bubble, "send" it, etc.), so
 * the same component works for a full inbox and a single embedded thread.
 */
( function () {
	'use strict';

	var EMOJI = [
		'😀', '😄', '😊', '🙂', '😉', '😍', '🤩', '😎', '🤔', '😅',
		'😂', '🙌', '👏', '👍', '👌', '🙏', '💪', '✅', '⭐', '🎉',
		'📚', '✏️', '📝', '🎯', '⏰', '📅', '💬', '📌', '❤️', '💯',
		'👋', '🤝', '🧠', '🗣️', '👂', '👀', '☕', '🎧', '🏆', '🔥'
	];

	function buildEmojiGrid( popover, onPick ) {
		if ( popover.childElementCount ) { return; }
		EMOJI.forEach( function ( emoji ) {
			var btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'chat-composer__emoji-btn';
			btn.textContent = emoji;
			btn.setAttribute( 'aria-label', emoji );
			btn.addEventListener( 'click', function () { onPick( emoji ); } );
			popover.appendChild( btn );
		} );
	}

	function initComposer( root ) {
		var editor = root.querySelector( '.chat-composer__input' );
		var sendBtn = root.querySelector( '.chat-composer__send' );
		var emojiToggle = root.querySelector( '[data-emoji-toggle]' );
		var popover = root.querySelector( '.chat-composer__emoji-popover' );
		if ( ! editor ) { return; }

		root.querySelectorAll( '[data-cmd]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				editor.focus();
				document.execCommand( btn.getAttribute( 'data-cmd' ) );
			} );
		} );

		function closeEmoji() {
			if ( ! popover ) { return; }
			popover.hidden = true;
			if ( emojiToggle ) { emojiToggle.setAttribute( 'aria-expanded', 'false' ); }
		}

		if ( emojiToggle && popover ) {
			buildEmojiGrid( popover, function ( emoji ) {
				editor.focus();
				document.execCommand( 'insertText', false, emoji );
				closeEmoji();
			} );
			emojiToggle.addEventListener( 'click', function ( e ) {
				e.stopPropagation();
				var willOpen = popover.hidden;
				popover.hidden = ! willOpen;
				emojiToggle.setAttribute( 'aria-expanded', willOpen ? 'true' : 'false' );
			} );
			document.addEventListener( 'click', function ( e ) {
				if ( ! popover.hidden && ! popover.contains( e.target ) && e.target !== emojiToggle ) { closeEmoji(); }
			} );
			document.addEventListener( 'keydown', function ( e ) {
				if ( e.key === 'Escape' && ! popover.hidden ) { closeEmoji(); editor.focus(); }
			} );
		}

		/**
	 * Restricts composer output to exactly the tags the toolbar itself can
	 * produce (bold/italic/underline/line breaks) and strips everything
	 * else -- attributes included. The composer is a real contenteditable
	 * field, so a rich paste could otherwise inject arbitrary markup
	 * (event handler attributes, embedded elements, etc.) that would later
	 * be re-inserted as raw HTML wherever the message is rendered.
	 */
	var ALLOWED_TAGS = { B: true, STRONG: true, I: true, EM: true, U: true, BR: true, DIV: true, SPAN: true };

	function sanitizeComposerHtml( html ) {
		var container = document.createElement( 'div' );
		container.innerHTML = html;

		( function clean( node ) {
			Array.prototype.slice.call( node.childNodes ).forEach( function ( child ) {
				if ( child.nodeType === 1 ) {
					if ( ! ALLOWED_TAGS[ child.tagName ] ) {
						// Unwrap disallowed elements instead of dropping their
						// text content, so e.g. a pasted <a> still keeps its label.
						while ( child.firstChild ) { node.insertBefore( child.firstChild, child ); }
						node.removeChild( child );
						return;
					}
					Array.prototype.slice.call( child.attributes ).forEach( function ( attr ) { child.removeAttribute( attr.name ); } );
					clean( child );
				} else if ( child.nodeType !== 3 ) {
					node.removeChild( child ); // comments, etc.
				}
			} );
		}( container ) );

		return container.innerHTML;
	}

	function send() {
			var html = sanitizeComposerHtml( editor.innerHTML.trim() );
			var text = editor.textContent.trim();
			if ( ! text ) { return; }
			root.dispatchEvent( new CustomEvent( 'chat-composer:send', { bubbles: true, detail: { html: html, text: text } } ) );
			editor.innerHTML = '';
			editor.focus();
		}

		if ( sendBtn ) { sendBtn.addEventListener( 'click', send ); }
		editor.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Enter' && ! e.shiftKey ) {
				e.preventDefault();
				send();
			}
		} );
	}

	function initChatComposers() {
		document.querySelectorAll( '.chat-composer' ).forEach( initComposer );
	}

	window.mahtelaChat = { init: initChatComposers };

	document.addEventListener( 'DOMContentLoaded', initChatComposers );
}() );
