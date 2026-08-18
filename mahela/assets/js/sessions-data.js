/**
 * Shared session + conversation data layer, backed by localStorage, so
 * teacher-schedule.html, student-detail.html, student-panel.html, and
 * messages.html all read and write the SAME state instead of each page
 * hardcoding its own disconnected copy (which is what made "cancel a
 * class and notify the student" impossible before this file existed).
 *
 * Session shape:
 *   { id, date: 'YYYY-MM-DD', time: 'HH:MM', duration (minutes),
 *     studentKey, classType: 'in-person' | 'online',
 *     status: 'scheduled' | 'held' | 'cancelled',
 *     cancelReason: null | 'teacher' | 'student' | 'no-show',
 *     chargeApplied: null | true | false,  // only meaningful when cancelled
 *     note: string,   // teacher's comment, shown to the student
 *     settled: boolean }
 */
( function () {
	'use strict';

	var SESSIONS_KEY = 'mahtela-schedule-sessions';
	var MESSAGES_KEY = 'mahtela-messages';

	var DEFAULT_SESSIONS = [
		{ id: 's1', date: '2026-08-19', time: '17:00', duration: 60, studentKey: 'elena',  classType: 'in-person', status: 'scheduled', cancelReason: null, chargeApplied: null, note: '', settled: false },
		{ id: 's2', date: '2026-08-20', time: '10:00', duration: 45, studentKey: 'daniel', classType: 'online',    status: 'scheduled', cancelReason: null, chargeApplied: null, note: '', settled: false },
		{ id: 's3', date: '2026-08-21', time: '19:30', duration: 60, studentKey: 'marco',  classType: 'in-person', status: 'scheduled', cancelReason: null, chargeApplied: null, note: '', settled: false },
		{ id: 's4', date: '2026-08-24', time: '16:00', duration: 45, studentKey: 'yuki',   classType: 'online',    status: 'scheduled', cancelReason: null, chargeApplied: null, note: '', settled: false },
		{ id: 's5', date: '2026-08-12', time: '17:00', duration: 60, studentKey: 'elena',  classType: 'in-person', status: 'held',      cancelReason: null, chargeApplied: null, note: 'Great progress on past tense today.', settled: false },
		{ id: 's6', date: '2026-08-05', time: '17:00', duration: 60, studentKey: 'elena',  classType: 'online',    status: 'held',      cancelReason: null, chargeApplied: null, note: '', settled: false },
		{ id: 's7', date: '2026-07-29', time: '17:00', duration: 60, studentKey: 'elena',  classType: 'in-person', status: 'cancelled', cancelReason: 'student', chargeApplied: false, note: '', settled: false },
		{ id: 's8', date: '2026-07-22', time: '17:00', duration: 60, studentKey: 'elena',  classType: 'in-person', status: 'held',      cancelReason: null, chargeApplied: null, note: '', settled: false }
	];

	var DEFAULT_CONVERSATIONS = {
		elena: {
			name: 'Elena Kim', initials: 'EK', gender: 'female',
			messages: [
				{ dir: 'in',  html: 'Hi! Just wanted to check — are we still on for Wednesday at 5?', time: 'Yesterday, 14:02' },
				{ dir: 'out', html: "Yes, all set! I'll send the reading passage beforehand.", time: 'Yesterday, 14:10' },
				{ dir: 'in',  html: 'Perfect, thank you!', time: 'Yesterday, 14:11' }
			]
		},
		daniel: {
			name: 'Daniel Cruz', initials: 'DC', gender: 'male',
			messages: [
				{ dir: 'in', html: 'Sorry, can we move Thursday to 11 instead of 10?', time: 'Mon, 09:20' },
				{ dir: 'out', html: 'Sure, 11:00 works. See you then!', time: 'Mon, 09:24' }
			]
		},
		sara: {
			name: 'Sara Ahmadi', initials: 'SA', gender: 'female',
			messages: [
				{ dir: 'in', html: "Thanks for today's session, the essay feedback was really helpful.", time: 'Fri, 18:40' }
			]
		},
		marco: {
			name: 'Marco Rossi', initials: 'MR', gender: 'male',
			messages: [
				{ dir: 'out', html: 'Reminder: bring your workbook to the next class.', time: 'Wed, 20:05' },
				{ dir: 'in', html: '👍 got it', time: 'Wed, 20:07' }
			]
		},
		yuki: {
			name: 'Yuki Tanaka', initials: 'YT', gender: 'female',
			messages: [
				{ dir: 'in', html: 'Can we reschedule this week?', time: 'Sun, 12:00' },
				{ dir: 'out', html: 'Of course — what day works better for you?', time: 'Sun, 12:15' }
			]
		}
	};

	var SESSION_DEFAULTS = { classType: 'in-person', status: 'scheduled', cancelReason: null, chargeApplied: null, note: '', settled: false };

	function loadSessions() {
		try {
			var raw = localStorage.getItem( SESSIONS_KEY );
			if ( raw ) {
				var parsed = JSON.parse( raw );
				// Backfill any session saved before classType/status/cancelReason/
				// chargeApplied/note/settled existed, so older localStorage data
				// (or a page that hasn't been updated yet) never produces
				// undefined where the UI expects a real value.
				return parsed.map( function ( s ) {
					return Object.assign( {}, SESSION_DEFAULTS, s );
				} );
			}
		} catch ( e ) { /* fall through to seed */ }
		var seeded = JSON.parse( JSON.stringify( DEFAULT_SESSIONS ) );
		localStorage.setItem( SESSIONS_KEY, JSON.stringify( seeded ) );
		return seeded;
	}

	function saveSessions( sessions ) {
		localStorage.setItem( SESSIONS_KEY, JSON.stringify( sessions ) );
		document.dispatchEvent( new CustomEvent( 'mahtela:sessionschange' ) );
	}

	function loadConversations() {
		try {
			var raw = localStorage.getItem( MESSAGES_KEY );
			if ( raw ) { return JSON.parse( raw ); }
		} catch ( e ) { /* fall through to seed */ }
		var seeded = JSON.parse( JSON.stringify( DEFAULT_CONVERSATIONS ) );
		localStorage.setItem( MESSAGES_KEY, JSON.stringify( seeded ) );
		return seeded;
	}

	function saveConversations( convos ) {
		localStorage.setItem( MESSAGES_KEY, JSON.stringify( convos ) );
		document.dispatchEvent( new CustomEvent( 'mahtela:messageschange' ) );
	}

	/**
	 * Appends an outgoing (teacher -> student) message to a student's
	 * thread and persists it -- this is what lets "Request Settlement"
	 * on the Finance tab actually show up in messages.html.
	 */
	function sendMessageTo( studentKey, html ) {
		var convos = loadConversations();
		if ( ! convos[ studentKey ] ) { return false; }
		convos[ studentKey ].messages.push( { dir: 'out', html: html, time: 'Just now' } );
		saveConversations( convos );
		return true;
	}

	window.mahtelaData = {
		loadSessions: loadSessions,
		saveSessions: saveSessions,
		loadConversations: loadConversations,
		saveConversations: saveConversations,
		sendMessageTo: sendMessageTo
	};
}() );
