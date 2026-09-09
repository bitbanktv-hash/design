/**
 * Shared helpers for the public (no-login) pages: homepage, teachers
 * directory, blog. Requires roster-data.js and i18n.js to already be
 * loaded on the page.
 */
function escapeHtml( s ) {
	var d = document.createElement( 'div' );
	d.textContent = s;
	return d.innerHTML;
}

/**
 * Blog post bodies are rich HTML (from the blog editor's contenteditable
 * surface). Card previews need a plain-text excerpt -- truncating the raw
 * HTML by character count would risk cutting mid-tag and leaving broken
 * markup in the snippet, so this strips tags first.
 */
function stripHtmlForSnippet( html ) {
	var withBreaks = html.replace( /<\/(p|h1|h2|h3|h4|li|blockquote|div|br)>/gi, ' ' ).replace( /<br\s*\/?>/gi, ' ' );
	var div = document.createElement( 'div' );
	div.innerHTML = withBreaks;
	return ( div.textContent || '' ).replace( /\s+/g, ' ' ).trim();
}

var LANGUAGE_NAMES = { en: 'English', fr: 'French', de: 'German', ar: 'Arabic', tr: 'Turkish', es: 'Spanish', fa: 'Persian', it: 'Italian' };

function publishedTeachers() {
	var teachers = window.mahtelaRoster.loadTeachers();
	return Object.keys( teachers )
		.map( function ( k ) { return teachers[ k ]; } )
		.filter( function ( t ) { return t.portfolio && t.portfolio.published; } );
}

function allBlogPosts() {
	var teachers = window.mahtelaRoster.loadTeachers();
	var posts = [];
	Object.keys( teachers ).forEach( function ( key ) {
		var t = teachers[ key ];
		( t.blogPosts || [] ).filter( function ( post ) { return post.published !== false && post.archived !== true; } ).forEach( function ( post ) { posts.push( { post: post, teacher: t } ); } );
	} );
	posts.sort( function ( a, b ) { return b.post.createdAt.localeCompare( a.post.createdAt ); } );
	return posts;
}

function renderPublicTeacherCard( t, lang, dict ) {
	var p = t.portfolio;
	var langLabel = ( p.languages || [] ).map( function ( code ) { return LANGUAGE_NAMES[ code ] || code; } ).join( ', ' );
	var classTypeLabel = ( p.classTypes || [] ).map( function ( ct ) { return ct === 'online' ? dict.class_type_online[ lang ] : dict.class_type_in_person[ lang ]; } ).join( ' · ' );
	var priceLabel = window.mahtelaI18n.formatCurrency( p.sessionPrice, p.priceUnit, lang );

	var card = document.createElement( 'a' );
	card.href = 'public-teacher-profile.html?teacher=' + encodeURIComponent( t.id );
	card.className = 'card public-teacher-card';
	card.innerHTML =
		'<div class="public-teacher-card__head">' +
			'<span class="public-teacher-card__avatar"></span>' +
			'<div><div class="public-teacher-card__lang"></div><div class="public-teacher-card__name"></div></div>' +
		'</div>' +
		'<p class="public-teacher-card__intro"></p>' +
		'<div class="public-teacher-card__meta">' +
			'<span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg><span></span></span>' +
			'<span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="14" height="10" rx="1"/><path d="M8 20h4M10 14v6M17 8l5-3v10l-5-3"/></svg><span></span></span>' +
		'</div>' +
		'<div class="public-teacher-card__footer"><span></span><span class="public-teacher-card__price"></span></div>';
	card.querySelector( '.public-teacher-card__avatar' ).innerHTML = window.mahtelaRoster.avatarHTML( { photo: t.photo, name: t.name }, window.mahtelaRoster.initials( t.name ) );
	card.querySelector( '.public-teacher-card__lang' ).textContent = langLabel;
	card.querySelector( '.public-teacher-card__name' ).textContent = p.displayName || t.name;
	card.querySelector( '.public-teacher-card__intro' ).textContent = p.introTitle || t.bio || '';
	var yearsNum = lang === 'fa' ? window.mahtelaCalendar.toFaDigits( p.yearsExperience || 0 ) : ( p.yearsExperience || 0 );
	card.querySelectorAll( '.public-teacher-card__meta span span' )[ 0 ].textContent = yearsNum + ( lang === 'fa' ? ' سال تجربه تدریس' : ' years teaching' );
	card.querySelectorAll( '.public-teacher-card__meta span span' )[ 1 ].textContent = classTypeLabel;
	card.querySelector( '.public-teacher-card__footer span' ).textContent = '';
	var durationNum = lang === 'fa' ? window.mahtelaCalendar.toFaDigits( p.sessionDuration ) : p.sessionDuration;
	card.querySelector( '.public-teacher-card__price' ).innerHTML = priceLabel + '<small>' + ( lang === 'fa' ? 'هر جلسه · ' + durationNum + ' دقیقه' : 'per session · ' + durationNum + ' min' ) + '</small>';
	return card;
}

function renderPublicBlogCard( item, lang, linkOverride ) {
	var card = document.createElement( 'a' );
	card.href = linkOverride || ( 'public-blog.html?post=' + item.post.id );
	card.className = 'card public-blog-card';
	var plainText = stripHtmlForSnippet( item.post.body );
	var snippet = plainText.length > 90 ? plainText.slice( 0, 90 ) + '…' : plainText;
	card.innerHTML =
		( item.post.coverImage ? '<div class="public-blog-card__cover"><img src="" alt=""></div>' : '' ) +
		'<h3 class="public-blog-card__title"></h3>' +
		'<p class="public-blog-card__snippet"></p>' +
		'<div class="public-blog-card__author"><span class="public-blog-card__author-avatar"></span><span></span></div>';
	if ( item.post.coverImage ) { card.querySelector( '.public-blog-card__cover img' ).src = item.post.coverImage; }
	card.querySelector( '.public-blog-card__title' ).textContent = item.post.title;
	card.querySelector( '.public-blog-card__snippet' ).textContent = snippet;
	card.querySelector( '.public-blog-card__author-avatar' ).innerHTML = window.mahtelaRoster.avatarHTML( { photo: item.teacher.photo, name: item.teacher.name }, window.mahtelaRoster.initials( item.teacher.name ) );
	card.querySelector( '.public-blog-card__author span:last-child' ).textContent = item.teacher.name;
	return card;
}
