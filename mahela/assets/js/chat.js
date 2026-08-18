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

		function send() {
			var html = editor.innerHTML.trim();
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
