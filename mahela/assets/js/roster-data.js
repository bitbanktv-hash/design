/**
 * Shared student + teacher roster, backed by localStorage, so every page
 * that shows or edits a student/teacher (teacher-dashboard, student-detail,
 * teacher-schedule, admin-students, admin-teachers, settings) reads and
 * writes the SAME records instead of each hardcoding its own copy. This is
 * what makes "Add Student", "Edit Details", "New Assessment", and "Create
 * Teacher" actually persist and show up everywhere else.
 *
 * Student shape:
 *   { key, name, initials, gender: 'female'|'male', level (e.g. 'B2'),
 *     rate (Toman/session), duration (minutes), since: 'YYYY-MM-DD',
 *     skills: { listening, speaking, reading, writing } -- each an IELTS
 *     band score 0-9 in 0.5 increments, email, phone, teacherId }
 *
 * Teacher shape:
 *   { id, name, email, phone, status: 'active'|'restricted'|'suspended',
 *     color (CSS var suffix, e.g. 'c-pink'),
 *     permissions: { manage_students, manage_schedule, manage_finance,
 *                    manage_skills, send_messages } }
 */
( function () {
	'use strict';

	var STUDENTS_KEY = 'mahtela-students';
	var TEACHERS_KEY = 'mahtela-teachers';

	// Level code -> display label + badge color, kept as a single lookup so
	// editing a student's level can never leave the label/badge out of sync
	// with the code (which was possible when each page stored all three
	// redundantly).
	var LEVELS = {
		A1: { label: 'Beginner · A1', badge: 'badge--neutral' },
		A2: { label: 'Pre-Intermediate · A2', badge: 'badge--neutral' },
		B1: { label: 'Intermediate · B1', badge: 'badge--warning' },
		B2: { label: 'Upper-Intermediate · B2', badge: 'badge--accent' },
		C1: { label: 'Advanced · C1', badge: 'badge--success' },
		C2: { label: 'Proficient · C2', badge: 'badge--success' }
	};

	var DEFAULT_STUDENTS = {
		elena:  { key: 'elena',  name: 'Elena Kim',   initials: 'EK', gender: 'female', level: 'B2', rate: 250000, duration: 60, since: '2026-01-15', skills: { listening: 6.5, speaking: 6.0, reading: 7.0, writing: 6.0 }, email: 'elena@example.com',  phone: '+98 912 111 1111', teacherId: 'jane' },
		daniel: { key: 'daniel', name: 'Daniel Cruz', initials: 'DC', gender: 'male',   level: 'A1', rate: 200000, duration: 45, since: '2026-03-03', skills: { listening: 3.0, speaking: 2.5, reading: 3.5, writing: 2.5 }, email: 'daniel@example.com', phone: '+98 912 222 2222', teacherId: 'jane' },
		sara:   { key: 'sara',   name: 'Sara Ahmadi', initials: 'SA', gender: 'female', level: 'C1', rate: 300000, duration: 60, since: '2025-11-10', skills: { listening: 7.5, speaking: 7.0, reading: 8.0, writing: 7.0 }, email: 'sara@example.com',   phone: '+98 912 333 3333', teacherId: 'alex' },
		marco:  { key: 'marco',  name: 'Marco Rossi', initials: 'MR', gender: 'male',   level: 'B1', rate: 250000, duration: 60, since: '2026-02-20', skills: { listening: 5.0, speaking: 4.5, reading: 5.5, writing: 4.5 }, email: 'marco@example.com',  phone: '+98 912 444 4444', teacherId: 'alex' },
		yuki:   { key: 'yuki',   name: 'Yuki Tanaka', initials: 'YT', gender: 'female', level: 'A2', rate: 220000, duration: 45, since: '2026-04-05', skills: { listening: 4.0, speaking: 3.5, reading: 4.5, writing: 3.5 }, email: 'yuki@example.com',   phone: '+98 912 555 5555', teacherId: 'sam' }
	};

	var DEFAULT_TEACHERS = {
		jane:  { id: 'jane',  name: 'Jane Doe',     email: 'jane@mahela.com',  phone: '+98 912 000 0000', status: 'active',     color: 'c-pink',       specialization: 'English', bio: 'English teacher with 8 years of experience helping students build real conversational confidence, from everyday speaking to exam prep.', permissions: { manage_students: true, manage_schedule: true, manage_finance: true, manage_skills: true, send_messages: true } },
		alex:  { id: 'alex',  name: 'Alex Turner',  email: 'alex@mahela.com',  phone: '+98 912 111 2222', status: 'active',     color: 'c-teal',       specialization: 'English', bio: 'Specializes in advanced and business English, with a focus on writing clarity and professional communication.', permissions: { manage_students: true, manage_schedule: true, manage_finance: true, manage_skills: true, send_messages: true } },
		maria: { id: 'maria', name: 'Maria Garcia', email: 'maria@mahela.com', phone: '+98 912 222 3333', status: 'restricted', color: 'c-orange',     specialization: 'Spanish', bio: 'Native Spanish speaker teaching conversational and grammar fundamentals for beginner to intermediate students.', permissions: { manage_students: true, manage_schedule: true, manage_finance: false, manage_skills: true, send_messages: false } },
		sam:   { id: 'sam',   name: 'Sam Lee',      email: 'sam@mahela.com',   phone: '+98 912 333 4444', status: 'active',     color: 'c-green',      specialization: 'English', bio: 'Focused on listening and pronunciation, helping students sound natural and confident in everyday English.', permissions: { manage_students: true, manage_schedule: true, manage_finance: true, manage_skills: true, send_messages: true } },
		priya: { id: 'priya', name: 'Priya Patel',  email: 'priya@mahela.com', phone: '+98 912 444 5555', status: 'active',     color: 'brand-strong', specialization: 'French', bio: 'Passionate about making French grammar approachable, with an emphasis on practical, everyday vocabulary.', permissions: { manage_students: true, manage_schedule: true, manage_finance: true, manage_skills: true, send_messages: true } },
		omar:  { id: 'omar',  name: 'Omar Hassan',  email: 'omar@mahela.com',  phone: '+98 912 555 6666', status: 'suspended',  color: 'c-teal',       specialization: 'German', bio: 'German language instructor with a background in linguistics and a love for helping students past the beginner plateau.', permissions: { manage_students: false, manage_schedule: false, manage_finance: false, manage_skills: false, send_messages: false } }
	};

	function loadStudents() {
		try {
			var raw = localStorage.getItem( STUDENTS_KEY );
			if ( raw ) { return JSON.parse( raw ); }
		} catch ( e ) { /* fall through to seed */ }
		var seeded = JSON.parse( JSON.stringify( DEFAULT_STUDENTS ) );
		localStorage.setItem( STUDENTS_KEY, JSON.stringify( seeded ) );
		return seeded;
	}

	function saveStudents( students ) {
		localStorage.setItem( STUDENTS_KEY, JSON.stringify( students ) );
		document.dispatchEvent( new CustomEvent( 'mahtela:studentschange' ) );
	}

	function loadTeachers() {
		try {
			var raw = localStorage.getItem( TEACHERS_KEY );
			if ( raw ) { return JSON.parse( raw ); }
		} catch ( e ) { /* fall through to seed */ }
		var seeded = JSON.parse( JSON.stringify( DEFAULT_TEACHERS ) );
		localStorage.setItem( TEACHERS_KEY, JSON.stringify( seeded ) );
		return seeded;
	}

	function saveTeachers( teachers ) {
		localStorage.setItem( TEACHERS_KEY, JSON.stringify( teachers ) );
		document.dispatchEvent( new CustomEvent( 'mahtela:teacherschange' ) );
	}

	function levelInfo( levelCode ) {
		return LEVELS[ levelCode ] || LEVELS.A1;
	}

	function initials( name ) {
		return name.split( ' ' ).map( function ( p ) { return p[ 0 ]; } ).join( '' ).slice( 0, 2 ).toUpperCase();
	}

	/** Turns "New Student Name" into a unique key like 'new-student-name',
	 *  disambiguated with a numeric suffix if that key is already taken. */
	function slugify( name, existingKeys ) {
		var base = name.trim().toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-+|-+$/g, '' ) || 'student';
		var key = base, n = 2;
		while ( existingKeys.indexOf( key ) !== -1 ) { key = base + '-' + n; n++; }
		return key;
	}

	window.mahtelaRoster = {
		loadStudents: loadStudents,
		saveStudents: saveStudents,
		loadTeachers: loadTeachers,
		saveTeachers: saveTeachers,
		levelInfo: levelInfo,
		levels: LEVELS,
		initials: initials,
		slugify: slugify
	};
}() );
